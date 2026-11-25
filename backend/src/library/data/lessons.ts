import { Lesson } from '../../domain/models.js';

export const LESSONS: Lesson[] = [
  {
    id: 'progressive-overload',
    course: 'Training basics',
    title: 'Progressive overload, the only rule that matters',
    minutes: 4,
    summary: 'Why doing a little more than last time is how muscle and strength are built.',
    body: [
      'Your body adapts to the work you give it, then stops adapting once that work feels routine. Progressive overload means asking for slightly more over time: one more rep, a little more weight, or the same weight with better control.',
      'That is why the Previous column sits right next to today\'s inputs. Before each set you can see exactly what you did last time, so the target is never a guess.',
      'You don\'t need to beat every number every session. Over weeks, the trend should point up. If a lift has stalled for three sessions in a row, look at sleep, food and effort before changing the program.',
    ],
  },
  {
    id: 'rep-ranges',
    course: 'Training basics',
    title: 'Rep ranges and double progression',
    minutes: 5,
    summary: 'Add reps until you hit the top of the range, then add weight.',
    body: [
      'Every exercise has a recommended rep range, such as 8–12. Pick a weight you can lift for at least the bottom of the range with good form.',
      'Each session, try to add a rep. When you can go past the top of the range, increase the weight and start again near the bottom. This is called double progression.',
      'The blue arrows in your workout follow this rule. An arrow on the reps means push for one more. An arrow on the weight means it\'s time to go heavier, or lighter if you fell short of the range.',
    ],
  },
  {
    id: 'rating-effort',
    course: 'Training basics',
    title: 'Rating effort honestly',
    minutes: 3,
    summary: 'How many reps did you have left? That one question drives your next session.',
    body: [
      'After each set you rate how hard it was. Easy means you could have done three or more extra reps. Ideal means one to three left. Max effort means no more reps with good form.',
      'Most working sets should land in Ideal. That is hard enough to grow, but not so hard that your form breaks or recovery suffers.',
      'Be honest. If you rate everything as Max, the app will hold your weight back. If you rate everything as Easy, it will push you faster than you can recover.',
    ],
  },
  {
    id: 'supersets',
    course: 'Training basics',
    title: 'Supersets: save time without losing strength',
    minutes: 3,
    summary: 'Pair exercises that don\'t compete for the same muscles.',
    body: [
      'A superset is two or more exercises done back to back, labelled A and B. You do set 1A, then 1B, then rest, then 2A and 2B.',
      'Pair muscles that don\'t overlap, like a chest press with a fly, or lateral raises with triceps pushdowns. Each muscle still gets a full rest while the other works.',
      'Your rest timer starts after you finish a full round, not after each exercise.',
    ],
  },
  {
    id: 'protein',
    course: 'Nutrition',
    title: 'How much protein you actually need',
    minutes: 4,
    summary: 'A simple daily target and how to spread it across meals.',
    body: [
      'For people who lift, around 1.6–2.2 g of protein per kg of body weight per day covers almost everyone. When you\'re cutting, aim for the higher end to protect muscle.',
      'Split it across three or four meals of 30–50 g each. That is easier to hit than one huge serving at dinner.',
      'Lean meat, fish, eggs, Greek yogurt, cottage cheese, lentils and whey are all efficient ways to get there.',
    ],
  },
  {
    id: 'calorie-deficit',
    course: 'Nutrition',
    title: 'Losing fat while keeping your lifts',
    minutes: 5,
    summary: 'A moderate deficit, high protein and heavy training.',
    body: [
      'To lose fat you need to eat less energy than you burn. A deficit that loses about 0.5–1% of body weight per week keeps most people strong and sane.',
      'Keep lifting heavy. Your training is the signal that tells your body to keep its muscle while you eat less.',
      'Weigh yourself most mornings and look at the weekly trend, not single days. Water and food volume can swing the scale by a kilogram overnight.',
    ],
  },
  {
    id: 'sleep',
    course: 'Recovery',
    title: 'Sleep is part of the program',
    minutes: 3,
    summary: 'Seven to nine hours does more for your lifts than any supplement.',
    body: [
      'Muscle is built while you recover, not while you train. Short sleep lowers strength, motivation and how well you control your appetite.',
      'Keep a steady bedtime, a cool dark room, and no caffeine after mid-afternoon.',
    ],
  },
  {
    id: 'deload',
    course: 'Recovery',
    title: 'When to take a lighter week',
    minutes: 3,
    summary: 'Signs you need a deload and how to run one.',
    body: [
      'If your lifts drop for two sessions in a row, your joints ache, or every set feels like Max effort, take a lighter week.',
      'Keep the same exercises but cut the sets in half and use about 80% of your usual weights. You\'ll come back stronger the week after.',
    ],
  },
];
