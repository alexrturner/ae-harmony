<script lang="ts">
    import RecordRTC from 'recordrtc'
    import { createEventDispatcher, onDestroy } from 'svelte'
    
    const dispatch = createEventDispatcher();
    
    let recorder: any = null;
    let audioStream: MediaStream | null = null;
    let isRecording = false;
    let audioURL: string | null = null;
    let audioBlob: Blob | null = null;
    let error: string | null = null;

    const MAX_RECORDING_TIME = 60; // sec
    let recordingTimer: NodeJS.Timeout | null = null;
    let recordingTime = 0;

    const getUserMedia = async (constraints: MediaStreamConstraints) => {
        if (window.navigator.mediaDevices) {
            return window.navigator.mediaDevices.getUserMedia(constraints);
        }
        let legacyApi =
            navigator.getUserMedia || 
            navigator.webkitGetUserMedia || 
            navigator.mozGetUserMedia || 
            navigator.msGetUserMedia;
        if (legacyApi) {
            return new Promise(function (resolve, reject) {
                legacyApi.bind(window.navigator)(constraints, resolve, reject);
            });
        } else {
            throw new Error("User media API not supported");
        }
    };

    const browserIsSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    async function startRecording() {
        try {
            isRecording = true;
            const stream = await getUserMedia({ audio: true, video: false });
            audioStream = stream;

            const options = {
                disableLogs: true,
                type: "audio",
                mimeType: 'audio/wav',
                bufferSize: 16384,
                sampleRate: 44100,
                numberOfAudioChannels: 2,
            };

            if (browserIsSafari || isIOS) {
                // Better for iOS/Safari
                options.recorderType = RecordRTC.StereoAudioRecorder;
            }

            recorder = RecordRTC(stream, options);
            recorder.startRecording();
            
            error = null;
            recordingTime = 0;
            startRecordingTimer();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            error = 'Could not access microphone. Please ensure you have granted permission.';
            isRecording = false;
        }
    }

    function startRecordingTimer() {
        recordingTimer = setInterval(() => {
            recordingTime++;
            
            if (recordingTime >= MAX_RECORDING_TIME) {
                stopRecording();
            }
        }, 1000);
    }

    function clearRecordingTimer() {
        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }
    }

    function stopRecording() {
        if (recorder && isRecording) {
            clearRecordingTimer();
            
            recorder.stopRecording(() => {
                audioBlob = recorder.getBlob();
                audioURL = URL.createObjectURL(audioBlob);
                
                // Clean up
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                }
                isRecording = false;
            });
        }
    }

    function cancelRecording() {
        if (recorder && isRecording) {
            clearRecordingTimer();
            
            recorder.stopRecording(() => {
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                }
                
                recorder.destroy();
                isRecording = false;
                audioURL = null;
                audioBlob = null;
            });
        }
    }

    function clearRecording() {
        if (audioURL) {
            URL.revokeObjectURL(audioURL);
        }
        audioURL = null;
        audioBlob = null;
        
        if (recorder) {
            recorder.destroy();
            recorder = null;
        }
    }

    function handleFileUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            if (file.type.startsWith('audio/')) {
                audioBlob = file;
                audioURL = URL.createObjectURL(file);
                error = null;
            } else {
                error = 'Please select an audio file';
                clearRecording();
            }
        }
    }

    function sendAudio() {
        if (audioBlob) {
            dispatch('sendAudio', { audioBlob });
            clearRecording();
        }
    }

    onDestroy(() => {
        if (recorder) {
            recorder.destroy();
        }
        
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }
        
        if (audioURL) {
            URL.revokeObjectURL(audioURL);
        }
        
        clearRecordingTimer();
    });
</script>

<div class="audio-recorder">
    {#if error}
        <div class="alert alert-error">
            <span>{error}</span>
        </div>
    {/if}

    
        {#if !isRecording && !audioURL}
            <button 
                class="btn btn-primary" 
                on:click={startRecording}
                title="Start Recording"
            >
            ⬤
            </button>
            <label class="btn btn-primary" title="Upload Audio">
                <input
                    type="file"
                    accept="audio/*"
                    on:change={handleFileUpload}
                    class="hidden"
                />
                &uarr;
            </label>
        {:else if isRecording}
            <button 
                class="btn btn-circle btn-error animate-pulse" 
                on:click={stopRecording}
                title="Stop Recording"
            >
            &#x2B1B;
            </button>
            <button 
                class="btn btn-circle btn-primary" 
                on:click={cancelRecording}
                title="Cancel Recording"
            >
            &#x2715;
            </button>
        {:else if audioURL}
            
            <button 
                class="btn btn-circle btn-primary" 
                on:click={sendAudio}
                title="Send Recording"
            >
            &rarr;       
        </button>
            <button 
                class="btn btn-circle btn-primary" 
                on:click={clearRecording}
                title="Clear Recording"
            >
            &#x2715; 
        </button>
            <audio controls src={audioURL} class="">
                Your browser does not support the audio element.
            </audio>
        {/if}
    
</div> 

<style>
.audio-recorder {
    display: flex;
    gap: 0.5rem;
    width: 100%;
    /* justify-content: center; */
}

.audio-recorder .alert {
    padding: 0.5rem;
    /* border-radius: 0.5rem; */
    background-color: var(--cc-error, red);
    color: white;
    margin-bottom: 0.5rem;
}


.audio-recorder .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--pixel-size);
    height: var(--pixel-size);
    /* border: none; */
    cursor: pointer;
    /* transition: all 0.2s ease; */
    border: none;
    border: 2px outset var(--cc-border);
    box-sizing: border-box;
}

.audio-recorder .btn-primary {
    background-color: white;
    color: black;
}

.audio-recorder .btn-error {
    background-color: white;
    color: red;
}

.audio-recorder .btn:hover {
    /* filter: brightness(1.1); */
    border: 2px inset var(--cc-border) !important;
    transform: translateY(-1px);
}

.audio-recorder .btn:active {
    transform: translateY(1px);
}


/* in record */
.audio-recorder .animate-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.hidden {
    display: none;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.1;
    }
}


.audio-recorder audio {
    height: 2.5rem;
    background-color: #f3f4f6;
}

</style>