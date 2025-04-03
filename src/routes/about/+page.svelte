<script lang="ts">
  import { pb } from '$lib/pocketbase'
  import Icon from '@iconify/svelte'
  import { onMount } from 'svelte'

    
  interface SurveyResponse {
    question: string
    response: 'yes' | 'no' | 'idk'
    soundId: string
  }

  interface SurveyStats {
    yes: number
    no: number
    idk: number
    total: number
  }

  interface QuestionSound {
    id: string | null
    url: string | null
  }

  const questions = [
    {
      id: 'isthisdating',
      title: 'Is this Audio Dating?',
      icon: 'mdi-microphone'
    },
    {
      id: 'isthishow',
      title: 'How does it work?',
      icon: 'mdi-account-voice'
    },
    {
      id: 'isthisaudio',
      title: 'Why audio?',
      icon: 'mdi-heart'
    }
  ]

  let currentQuestion: string | null = null
  let showResponseForms: Record<string, boolean> = {}
  let stats: Record<string, SurveyStats> = {}
  let questionSounds: Record<string, QuestionSound> = {}
  let shownQuestions: Set<string> = new Set()
  let surveyCompleted = false

  function getRandomUnshownQuestion(): string | null {
    const unshownQuestions = questions.filter(q => !shownQuestions.has(q.id))
    if (unshownQuestions.length === 0) {
      surveyCompleted = true
      return null
    }
    const randomIndex = Math.floor(Math.random() * unshownQuestions.length)
    return unshownQuestions[randomIndex].id
  }

  async function loadNextQuestion() {
    const nextQuestionId = getRandomUnshownQuestion()
    if (!nextQuestionId) {
      console.log('donefornow')
      return
    }

    console.log('more')
    shownQuestions.add(nextQuestionId)
    currentQuestion = nextQuestionId
    await loadRandomSound(nextQuestionId)
  }

  async function loadRandomSound(questionId: string) {
    try {
          
      const sounds = await pb.collection('sounds').getList(1, 10, {
        filter: `questionId="${questionId}"`
      })
      
      // shuffle
      if (sounds.items.length > 0) {
        const randomIndex = Math.floor(Math.random() * sounds.items.length)
        const sound = sounds.items[randomIndex]
        questionSounds[questionId] = {
          id: sound.id,
          url: pb.getFileUrl(sound, sound.audioFile)
        }
      } else {
        console.log('wheresounds?', questionId)
      }
    } catch (error) {
      console.error('uhoh loading:', error)
    }
  }

  async function submitResponse(questionId: string, response: 'yes' | 'no' | 'idk') {
    if (!questionSounds[questionId]?.id) return

    try {
      await pb.collection('survey').create({
        question: questionId,
        response,
        soundId: questionSounds[questionId].id
      })

      await loadStats()
      showResponseForms[questionId] = false
      // Load next question after submitting response
      await loadNextQuestion()
    } catch (error) {
      console.error('uhoh response', error)
    }
  }

  async function loadStats() {
    try {
      const responses = await pb.collection('survey').getFullList()
      
      // stats
      questions.forEach(q => {
        const questionResponses = responses.filter(r => r.question === q.id)
        stats[q.id] = {
          yes: questionResponses.filter(r => r.response === 'yes').length,
          no: questionResponses.filter(r => r.response === 'no').length,
          idk: questionResponses.filter(r => r.response === 'idk').length,
          total: questionResponses.length
        }
      })
    } catch (error) {
      console.error('uhoh stats', error)
    }
  }

  onMount(async () => {
    await loadStats()
    // first timer
    await loadNextQuestion()
  })
</script>

<div class="container mx-auto px-4 py-8 max-w-2xl">
  <!-- <h1 class="text-3xl font-bold text-primary mb-8">About Audible Edging</h1> -->

  {#if surveyCompleted}
    <div class="card bg-base-200 p-8 rounded-lg text-center">
      <h2 class="text-2xl font-semibold mb-4">Thank you for your time</h2>
      <p class="text-lg">Your responses are important to us and we will be in touch soon.</p>
    </div>
  {:else}
    {#each questions as question}
      {#if currentQuestion === question.id}
        <section class="mb-8">
          <div class="card bg-base-200 p-4 rounded-lg">
            <div class="flex items-center gap-3 mb-4">
              <Icon icon={question.icon} class="w-6 h-6 text-primary" />
              <h2 class="text-2xl font-semibold">{question.title}</h2>
            </div>

            <div class="mb-4">
              <audio 
                controls 
                src={questionSounds[question.id]?.url || ''} 
                class="w-full"
                on:ended={() => {
                  showResponseForms[question.id] = true
                }}
              ></audio>
            </div>

            {#if showResponseForms[question.id]}
              <div class="flex gap-2 justify-center">
                <button 
                  class="btn btn-primary" 
                  on:click={() => submitResponse(question.id, 'yes')}
                >
                  Yes
                </button>
                <button 
                  class="btn btn-primary" 
                  on:click={() => submitResponse(question.id, 'no')}
                >
                  No
                </button>
                <button 
                  class="btn btn-primary" 
                  on:click={() => submitResponse(question.id, 'idk')}
                >
                  IDK
                </button>
              </div>
            {/if}

            {#if stats[question.id]}
              <div class="mt-4">
                <div class="flex gap-1 h-4 rounded-full overflow-hidden bar">
                  <div 
                    class="bg-success" 
                    style="width: {(stats[question.id].yes / stats[question.id].total) * 100}%"
                    title="Yes: {stats[question.id].yes}"
                  ></div>
                  <div 
                    class="bg-error" 
                    style="width: {(stats[question.id].no / stats[question.id].total) * 100}%"
                    title="No: {stats[question.id].no}"
                  ></div>
                  <div 
                    class="bg-info" 
                    style="width: {(stats[question.id].idk / stats[question.id].total) * 100}%"
                    title="IDK: {stats[question.id].idk}"
                  ></div>
                </div>
              </div>
            {/if}
          </div>
        </section>
      {/if}
    {/each}
  {/if}
</div>

<style>
    .bar {
       display: flex;
       flex-direction: row;
    }
    .bar div {
        height: 10px;
    }
  .bg-success { background-color: #22c55e; }
  .bg-error { background-color: #ef4444; }
  .bg-info { background-color: #3b82f6; }
</style> 