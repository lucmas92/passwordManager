<template>
  <div class="w-full bg-zinc-700 h-2 rounded">
    <div
      class="h-2 rounded transition-all duration-300"
      :class="strengthColor"
      :style="{ width: passwordStrengthScore * 25 + '%' }"
    ></div>
  </div>
  <p class="text-xs text-zinc-400 mt-1">{{ passwordStrengthText }}</p>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import zxcvbn from 'zxcvbn'
const props = defineProps<{
  password: string
}>()

const passwordStrengthScore = ref(0)
const passwordStrengthText = ref('')

const strengthColor = computed(() => {
  switch (passwordStrengthScore.value) {
    case 0:
    case 1:
      return 'bg-red-500'
    case 2:
      return 'bg-yellow-500'
    case 3:
      return 'bg-emerald-400'
    case 4:
      return 'bg-green-500'
    default:
      return 'bg-zinc-600'
  }
})
watch(
  () => props.password,
  () => {
    calculateStrength()
  },
)

onMounted(() => calculateStrength())

const calculateStrength = () => {
  if (props.password) {
    const result = zxcvbn(props.password)
    passwordStrengthScore.value = result.score
    passwordStrengthText.value = result.feedback.warning || result.feedback.suggestions[0] || ''
  } else {
    passwordStrengthScore.value = 0
    passwordStrengthText.value = ''
  }
}
</script>
