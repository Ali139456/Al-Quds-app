export const CategoryGradients = {
  light: {
    burgers: ['#E0C48A', '#D1AB66'] as [string, string],
    arabian: ['#FFD08A', '#FFB347'] as [string, string],
    chinese: ['#5EDDD0', '#2EC4B6'] as [string, string],
    fried: ['#FF7B85', '#E84855'] as [string, string],
    pasta: ['#B87EF0', '#9B5DE5'] as [string, string],
    fries: ['#FFD08A', '#E8A820'] as [string, string],
    drinks: ['#6EC4FF', '#3A9AD9'] as [string, string],
  },
  dark: {
    burgers: ['#E0C48A', '#A8894F'] as [string, string],
    arabian: ['#FFD08A', '#CC8A20'] as [string, string],
    chinese: ['#5EDDD0', '#1A9E92'] as [string, string],
    fried: ['#FF7B85', '#C42E3A'] as [string, string],
    pasta: ['#B87EF0', '#7B3FBE'] as [string, string],
    fries: ['#FFD08A', '#CC8A20'] as [string, string],
    drinks: ['#6EC4FF', '#2A7AB8'] as [string, string],
  },
} as const;

export type CategoryId = keyof typeof CategoryGradients.light;
