<script lang="ts">
    import { page } from '$app/stores'
    import AudioRecorder from '$lib/components/AudioRecorder.svelte'
    import { pb } from '$lib/pocketbase'
    import { currentUser } from '$lib/stores/user'
    import { Howl } from 'howler'
    import { onDestroy, onMount } from 'svelte'
    import { writable } from 'svelte/store'

    const chatId = $page.params.id;
    let messages: Array<any> = [];
    let otherUser: any = null;
    let chat: any = null;
    let loading = true;
    let scrollContainer: HTMLElement;

    
    const globalVolume = writable(1.0);
    let currentSound: Howl | null = null;
    let progressWidth = '0%';
    const audioPlayers = new Map<string, Howl>();
    let userSoundPlayers = new Map<string, Howl>();

    $: {
        if ($page.params.id) {
            loadChat();
            // clear audio players when changing chat
            audioPlayers.forEach(sound => sound.stop());
            audioPlayers.clear();
        }
    }

    // Use $currentUser in reactive statements
    $: isParticipant = $currentUser && chat?.expand?.participants?.some(
        (p: any) => p.id === $currentUser?.id
    );

    // viewer / participant view
    $: sortedMessages = [...messages].sort((a, b) => {
        const order = isParticipant ? 1 : -1;
        return order * (new Date(a.created).getTime() - new Date(b.created).getTime());
    });

    onDestroy(() => {
        userSoundPlayers.forEach(sound => sound.stop());
        userSoundPlayers.clear();
    });

    async function loadChat() {
        loading = true;
        try {
            chat = await pb.collection('chats').getOne($page.params.id, {
                expand: 'participants',
                fields: 'id,totalSize,lastMessageDate,expand.participants'
            });
            
            otherUser = chat.expand.participants.find(
                (p: any) => p.id !== $currentUser?.id
            );

            const messageRecords = await pb.collection('messages').getList(1, 50, {
                filter: `chat = "${$page.params.id}"`,
                sort: 'created',
                expand: 'sender'
            });
            
            messages = messageRecords.items;

            // update chat size
            await updateChatSize();


            // reset scroll position for new chat
            setTimeout(() => {
                if (scrollContainer) {
                    scrollContainer.scrollLeft = isParticipant ? 
                        scrollContainer.scrollWidth : 0;
                }
            }, 100);
        } catch (err) {
            console.error('Error loading chat:', err);
        } finally {
            loading = false;
        }
    }

    async function updateChatSize() {
        try {
            // total size from all messages
            let totalSize = 0;
            for (const message of messages) {
                if (message.currentSize) {
                    totalSize += message.currentSize;
                } else if (message.originalSize) {
                    totalSize += message.originalSize;
                }
            }
            
            // update changed size
            if (chat.totalSize !== totalSize) {
                await pb.collection('chats').update(chatId, {
                    totalSize: totalSize,
                    lastMessageDate: messages.length > 0 ? messages[messages.length - 1].created : null
                });
                
                // local chat object
                chat.totalSize = totalSize;
            }
        } catch (err) {
            console.error('uhoh chat size:', err);
        }
    }


    let isPlayingAll = false;
    let currentPlayingIndex = -1;


    // init current sound
    

    function playAllMessages() {
        if (isPlayingAll) {
            stopAllAudio();
            isPlayingAll = false;
            currentPlayingIndex = -1;
            resetAllPlayButtons();
            return;
        }

        

        if (currentSound) {
            currentSound.stop();
            currentSound = null;
        }

        isPlayingAll = true;
        currentPlayingIndex = 0;
        playNextInSequence();
    }

    function playNextInSequence() {
        if (!isPlayingAll || currentPlayingIndex >= sortedMessages.length) {
            isPlayingAll = false;
            currentPlayingIndex = -1;
            resetAllPlayButtons();
            return;
        }

        const message = sortedMessages[currentPlayingIndex];
        if (!message.audioFile) {
            currentPlayingIndex++;
            playNextInSequence();
            return;
        }

        const url = pb.getFileUrl(message, message.audioFile);
        let sound = audioPlayers.get(message.id);
        if (!sound) {
            sound = new Howl({
                src: [url],
                volume: $globalVolume,
                onend: () => {
                    const playButton = document.getElementById(`play-${message.id}`);
                    if (playButton) playButton.textContent = '';
                    currentPlayingIndex++;
                    if (isPlayingAll) {
                        playNextInSequence();
                    }
                }
            });
            audioPlayers.set(message.id, sound);
        }

        sound.volume($globalVolume);
        sound.play();
        currentSound = sound;

        const playButton = document.getElementById(`play-${message.id}`);
        if (playButton) playButton.textContent = '<3';
    }

    function resetAllPlayButtons() {
        sortedMessages.forEach(message => {
            const playButton = document.getElementById(`play-${message.id}`);
            if (playButton) playButton.textContent = '';
        });
    }


    
    function stopAllAudio() {
        if (currentSound) {
            currentSound.stop();
            currentSound = null;
        }
        audioPlayers.forEach(sound => sound.stop());
        resetAllPlayButtons();
        progressWidth = '0%';
    }

    function updateProgress() {
        if (currentSound && currentSound.playing()) {
            const seek = currentSound.seek() || 0;
            const duration = currentSound.duration();
            progressWidth = `${((seek / duration) * 100) || 0}%`;
            requestAnimationFrame(updateProgress);
        }
    }

    function playAudio(messageId: string, url: string) {
        // stop the play-all
        if (isPlayingAll) {
            stopAllAudio();
            isPlayingAll = false;
            currentPlayingIndex = -1;
        }

        let sound = audioPlayers.get(messageId);
        if (!sound) {
            sound = new Howl({
                src: [url],
                volume: $globalVolume,
                onplay: () => {
                    const playButton = document.getElementById(`play-${messageId}`);
                    if (playButton) playButton.textContent = '<3';
                    requestAnimationFrame(updateProgress);
                },
                onend: () => {
                    const playButton = document.getElementById(`play-${messageId}`);
                    if (playButton) playButton.textContent = '';
                    progressWidth = '0%';
                },
                onstop: () => {
                    progressWidth = '0%';
                },
                onpause: () => {
                    const playButton = document.getElementById(`play-${messageId}`);
                    if (playButton) playButton.textContent = '';
                }
            });
            audioPlayers.set(messageId, sound);
        }

        // If this is the currently playing sound, toggle pause/play
        if (currentSound === sound) {
            if (sound.playing()) {
                sound.pause();
            } else {
                sound.play();
            }
            return;
        }

        // If a different sound is playing, stop it and reset its play button
        if (currentSound) {
            currentSound.stop();
            // Find the message ID of the currently playing sound
            for (const [id, s] of audioPlayers.entries()) {
                if (s === currentSound) {
                    const playButton = document.getElementById(`play-${id}`);
                    if (playButton) playButton.textContent = '';
                    break;
                }
            }
        }
        sound.volume($globalVolume);
        sound.play();
        currentSound = sound;
    }

    // global volume
    $: {
        audioPlayers.forEach(sound => {
            sound.volume($globalVolume);
        });
    }

    // subscribe to new messages & update chat size
    let unsubscribe: (() => void) | undefined;
    
    onMount(async () => {
        loadChat();
        
        
        unsubscribe = await pb.collection('messages').subscribe('*', async ({ action, record }) => {
            if (action === 'create' && record.chat === chatId) {
                const messageWithSender = await pb.collection('messages').getOne(record.id, { expand: 'sender' });
                messages = [...messages, messageWithSender];

                
                await updateChatSize();
            }
        });
    });

    onDestroy(() => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
        userSoundPlayers.forEach(sound => sound.stop());
        userSoundPlayers.clear();
    });

    async function handleAudioMessage(event: CustomEvent) {
        try {
            const { audioBlob } = event.detail;
            const formData = new FormData();
            formData.append('audioFile', audioBlob, 'kisskiss.wav');
            formData.append('chat', chatId);
            formData.append('sender', $currentUser.id);

            const originalSize = audioBlob.size;
            formData.append('originalSize', originalSize.toString());
            formData.append('currentSize', originalSize.toString());

            await pb.collection('messages').create(formData);
        } catch (err) {
            console.error('Error sending audio message:', err);
        }
    }

    function formatTime(seconds: number): string {
        seconds = Math.floor(seconds);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function playUserSound(user: any) {
        if (!user?.sound) return;
        
        // stop user sound
        userSoundPlayers.forEach(sound => sound.stop());
        userSoundPlayers.clear();

        // play user sound
        const sound = new Howl({
            src: [pb.getFileUrl(user, user.sound)],
            onend: () => {
                // reset ui
                const button = document.getElementById(`user-${user.id}`);
                if (button) {
                    button.style.backgroundColor = user.colour;
                }
            }
        });
        sound.play();
        userSoundPlayers.set(user.id, sound);

        // change playing ui
        const button = document.getElementById(`user-${user.id}`);
        if (button) {
            button.style.backgroundColor = 'white';
        }
    }
</script>

<div class="chat-container">
    {#if loading}
        <div class="loading"></div>
    {:else}
        <div class="chat-header">
            <div class="playback-info">
                <div class="people">
                    {#if chat?.expand?.participants}
                        {#if isParticipant && otherUser}
                            <button 
                                id="user-{otherUser.id}"
                                class="user-button"
                                style="background-color: {otherUser.colour}; color: {otherUser.colour}"
                                on:click={() => playUserSound(otherUser)}
                            >
                                {otherUser.username}
                            </button>
                        {:else}
                            {#each chat.expand.participants as participant}
                                <button 
                                    id="user-{participant.id}"
                                    class="user-button"
                                    style="background-color: {participant.colour}; color: {participant.colour}"
                                    on:click={() => playUserSound(participant)}
                                >
                                    {participant.username}
                                </button>
                            {/each}
                        {/if}
                    {:else}
                        <!-- nobodyhere -->
                    {/if}
                </div>
                <div class="play-all-container">
                    <button 
                        class="play-all-button"
                        on:click={playAllMessages}
                        title={isPlayingAll ? "Stop playing all" : "Play all messages"}
                    >
                        {isPlayingAll ? '<3' : ''}
                    </button>
                    
                    <div class="volume-control">
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            bind:value={$globalVolume}
                        >
                    </div>
                </div>

                <div class="playback-progress">
                    <div class="time-display">
                        <span>{currentSound ? formatTime(currentSound.seek()) : '0:00'}</span>
                        <span>{currentSound ? formatTime(currentSound.duration()) : '0:00'}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: {progressWidth}"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="messages-container" bind:this={scrollContainer}>
            {#each sortedMessages as message}
                <div 
                    class="message {message.expand.sender.id === $currentUser?.id ? 'sent' : 'received'}"
                >
                    <div class="message-content">
                        <div class="audio-message">
                            <!-- <div class="pixel" style="background-color: {message.expand.sender.colour || '#666'}"></div> -->
                            <div class="audio-controls">
                                <button 
                                    id="play-{message.id}"
                                    aria-label="Listen"
                                    class="play-button"
                                    on:click={() => playAudio(message.id, pb.getFileUrl(message, message.audioFile))}
                                    style="color: {message.expand.sender.colour || '#666'}; border: 2px outset {message.expand.sender.colour || '#666'}; "
                                >
                                    
                                </button>
                            </div>
                        </div>
                        <!-- 
                        <div class="timestamp">{formatTimestamp(message.created)}
                        </div> 
                        -->
                    </div>
                </div>
            {/each}
        </div>

        {#if isParticipant}
            <div class="input-container">
                <AudioRecorder 
                    on:sendAudio={handleAudioMessage}
                />
            </div>
        {:else}
            <!-- lurk -->
        {/if}
    {/if}
</div>

<style>
.chat-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chat-header {
    padding: 1rem;
    border-bottom: 1px solid var(--cc-border);
}

.playback-info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-areas: 
        "people people play play"
        "time time time time";
    gap: 1.5rem;
    align-items: center;
}

.people {
    grid-area: people;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}
.people button {
    height: 2.5rem;
}


.play-all-container {
    grid-area: play;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
}

.play-all-button {
    width: 2.5rem;
    height: 2.5rem;
    background-color: white;
    color: black;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
}

.volume-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 10rem;
}

.playback-progress {
    grid-area: time;
    width: 100%;
}

.messages-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    /* gap: 1rem; */
    padding: 1rem;
    overflow-y: auto;
    scroll-behavior: smooth;
}

.message {
    display: flex;
    flex-direction: column;
    max-width: 80%;
    margin: 0 auto;
}

.message.sent {
    align-self: flex-end;
}

.message.received {
    align-self: flex-start;
}

.message-content {
    display: flex;
    flex-direction: column;
}

.audio-message {
    display: flex;
    align-items: center;
    justify-content: center;
    /* gap: 0.5rem; */
    /* background: var(--cc-bg-secondary); */
    /* padding: 0.5rem; */
    /* border-radius: 0.5rem; */
    /* border: 1px solid var(--cc-border); */
    /* box-shadow: var(--cc-primary) 0px 0px 20px 10px; */
}

.sent .audio-message {
    /* background: var(--cc-primary); */
    color: white;
}


.play-all-button:hover {
    background: var(--cc-primary-dark);
    border: 2px inset var(--cc-border) !important;
}


.play-button {
    width: 2rem;
    height: 2rem;
    min-width: 2rem;
    border: none;
    
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    /* transition: border-radius 0.2s ease-in-out; */
    background-color: white;
    font-family: monospace;
}


.sent .play-button {
    background: rgba(255, 255, 255, 0.9);
}

.play-button:hover {
    border: 2px inset var(--cc-border) !important;
    border: white !important;
    
}

.input-container {
    padding: 1rem;
    border-top: 1px solid var(--cc-border);
    background: var(--cc-bg);
}

.messages-container::-webkit-scrollbar {
    width: 8px;
    height: auto;
}

.messages-container::-webkit-scrollbar-track {
    background: var(--cc-bg-secondary);
    border-radius: 4px;
}


.messages-container::-webkit-scrollbar-thumb {
    background: var(--cc-primary);
    border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
    background: var(--cc-primary-dark);
}

.audio-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0;
    background: var(--cc-bg-secondary);
    /* border-radius: 0.5rem; */
    /* border: 1px solid var(--cc-border); */
}

/* hhhhhh */

.time-display {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--cc-text-muted);
    margin-bottom: 0.25rem;
}

.progress-bar {
    width: 100%;
    height: 4px;
    background: var(--cc-border);
    border-radius: 2px;
    overflow: hidden;
    cursor: pointer;
}

.progress-bar-fill {
    height: 100%;
    background: var(--cc-primary);
    transition: width 0.1s linear;
}

.volume-control input {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--cc-border);
    border-radius: 2px;
    outline: none;
}

.user-button {
    border: none;
    padding: 0.5rem 1rem;
    color: var(--cc-text);
    cursor: pointer;
    border: 2px outset var(--cc-border);
    box-sizing: border-box;
    /* transition: background-color 0.2s; */
}

.user-button:hover {
    
    border: 2px inset var(--cc-border) !important;
}

</style> 