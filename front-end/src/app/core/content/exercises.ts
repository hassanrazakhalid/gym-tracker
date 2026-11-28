import { Exercise } from '../models';

/** Built-in exercise library. `startLb` is only used by the server's sample data. */
export const EXERCISES: (Exercise & { startLb: number })[] = [
  // Chest
  {
    id: 'bench-press', name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell',
    repRange: { min: 6, max: 10 }, jointFriendly: false, startLb: 155,
    alternatives: ['db-bench-press', 'machine-chest-press', 'push-up'],
    formGuide: [
      'Lie with your eyes under the bar, feet flat and shoulder blades pinched together.',
      'Grip slightly wider than shoulder width and unrack with straight arms.',
      'Lower the bar to mid-chest with elbows about 45° from your body.',
      'Press up and slightly back until your arms are straight again.',
    ],
  },
  {
    id: 'incline-db-press', name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbell',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 50,
    alternatives: ['incline-bench-press', 'db-bench-press', 'machine-chest-press'],
    formGuide: [
      'Set the bench to 30°. Kick the dumbbells up as you lie back.',
      'Start with the weights over your upper chest, palms facing forward.',
      'Lower until you feel a stretch across the chest, elbows slightly tucked.',
      'Press up and in without clanking the dumbbells together.',
    ],
  },
  {
    id: 'incline-bench-press', name: 'Incline Bench Press', muscle: 'Chest', equipment: 'Barbell',
    repRange: { min: 6, max: 10 }, jointFriendly: false, startLb: 125,
    alternatives: ['incline-db-press', 'machine-chest-press'],
    formGuide: [
      'Set the bench to 30° and grip just outside shoulder width.',
      'Lower the bar to your upper chest, just below the collarbone.',
      'Press straight up, keeping your shoulder blades pinned.',
    ],
  },
  {
    id: 'db-bench-press', name: 'Dumbbell Bench Press', muscle: 'Chest', equipment: 'Dumbbell',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 55,
    alternatives: ['bench-press', 'machine-chest-press'],
    formGuide: [
      'Lie flat with the dumbbells over your chest, palms forward.',
      'Lower slowly until the dumbbells are level with your chest.',
      'Press back up, keeping your wrists stacked over your elbows.',
    ],
  },
  {
    id: 'cable-fly', name: 'Cable Fly', muscle: 'Chest', equipment: 'Cable',
    repRange: { min: 10, max: 20 }, jointFriendly: true, startLb: 25,
    alternatives: ['pec-deck', 'db-fly'],
    formGuide: [
      'Set the pulleys at shoulder height and take a split stance.',
      'With a soft bend in the elbows, open your arms until you feel a stretch.',
      'Squeeze the handles together in front of your chest, then return slowly.',
    ],
  },
  {
    id: 'pec-deck', name: 'Pec Deck', muscle: 'Chest', equipment: 'Machine',
    repRange: { min: 10, max: 20 }, jointFriendly: true, startLb: 90,
    alternatives: ['cable-fly', 'db-fly'],
    formGuide: [
      'Adjust the seat so the handles are at chest height.',
      'Bring the handles together in a wide arc, squeezing your chest.',
      'Let them open slowly until you feel a stretch.',
    ],
  },
  {
    id: 'db-fly', name: 'Dumbbell Fly', muscle: 'Chest', equipment: 'Dumbbell',
    repRange: { min: 10, max: 15 }, jointFriendly: false, startLb: 25,
    alternatives: ['cable-fly', 'pec-deck'],
    formGuide: [
      'Lie flat with dumbbells over your chest, palms facing each other.',
      'Open your arms in a wide arc with a slight bend in the elbows.',
      'Stop at chest level and bring the weights back together.',
    ],
  },
  {
    id: 'machine-chest-press', name: 'Machine Chest Press', muscle: 'Chest', equipment: 'Machine',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 120,
    alternatives: ['bench-press', 'db-bench-press'],
    formGuide: [
      'Set the seat so the handles line up with mid-chest.',
      'Press forward until your arms are straight, without locking out hard.',
      'Return slowly until you feel a stretch in the chest.',
    ],
  },
  {
    id: 'push-up', name: 'Weighted Push-up', muscle: 'Chest', equipment: 'Bodyweight',
    repRange: { min: 10, max: 20 }, jointFriendly: true, startLb: 25,
    alternatives: ['bench-press', 'db-bench-press'],
    formGuide: [
      'Place a plate on your upper back, hands slightly wider than shoulders.',
      'Keep a straight line from head to heels.',
      'Lower until your chest is a fist from the floor, then push back up.',
    ],
  },
  // Shoulders
  {
    id: 'overhead-press', name: 'Overhead Press', muscle: 'Shoulders', equipment: 'Barbell',
    repRange: { min: 6, max: 10 }, jointFriendly: false, startLb: 95,
    alternatives: ['db-shoulder-press', 'machine-shoulder-press'],
    formGuide: [
      'Stand with the bar on your front shoulders, grip just outside shoulder width.',
      'Brace your core and squeeze your glutes.',
      'Press straight up, moving your head back so the bar passes your chin.',
      'Finish with the bar over your mid-foot and your head through.',
    ],
  },
  {
    id: 'db-shoulder-press', name: 'Seated Dumbbell Press', muscle: 'Shoulders', equipment: 'Dumbbell',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 40,
    alternatives: ['overhead-press', 'machine-shoulder-press'],
    formGuide: [
      'Sit upright with back support, dumbbells at shoulder height.',
      'Press up until your arms are straight, without letting them touch.',
      'Lower under control back to shoulder height.',
    ],
  },
  {
    id: 'machine-shoulder-press', name: 'Machine Shoulder Press', muscle: 'Shoulders', equipment: 'Machine',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 90,
    alternatives: ['db-shoulder-press', 'overhead-press'],
    formGuide: [
      'Set the seat so the handles start at shoulder height.',
      'Press up smoothly and lower with control.',
    ],
  },
  {
    id: 'lateral-raise', name: 'Lateral Raise', muscle: 'Shoulders', equipment: 'Dumbbell',
    repRange: { min: 12, max: 20 }, jointFriendly: true, startLb: 20,
    alternatives: ['cable-lateral-raise'],
    formGuide: [
      'Stand tall with dumbbells at your sides and a slight lean forward.',
      'Raise your arms out to the side, leading with the elbows.',
      'Stop at shoulder height and lower slowly.',
    ],
  },
  {
    id: 'cable-lateral-raise', name: 'Cable Lateral Raise', muscle: 'Shoulders', equipment: 'Cable',
    repRange: { min: 12, max: 20 }, jointFriendly: true, startLb: 10,
    alternatives: ['lateral-raise'],
    formGuide: [
      'Stand side-on to a low pulley, holding the handle with your far hand.',
      'Raise your arm out to the side up to shoulder height.',
      'Lower slowly, keeping tension on the cable.',
    ],
  },
  {
    id: 'face-pull', name: 'Face Pull', muscle: 'Shoulders', equipment: 'Cable',
    repRange: { min: 12, max: 20 }, jointFriendly: true, startLb: 40,
    alternatives: ['rear-delt-fly'],
    formGuide: [
      'Set a rope at upper-chest height and grip with thumbs pointing back.',
      'Pull towards your face, splitting the rope and turning your hands out.',
      'Pause, then return slowly.',
    ],
  },
  {
    id: 'rear-delt-fly', name: 'Rear Delt Fly', muscle: 'Shoulders', equipment: 'Machine',
    repRange: { min: 12, max: 20 }, jointFriendly: true, startLb: 60,
    alternatives: ['face-pull'],
    formGuide: [
      'Sit facing the pec deck pad with the handles at shoulder height.',
      'Sweep your arms back in a wide arc, squeezing your upper back.',
      'Return slowly.',
    ],
  },
  // Triceps
  {
    id: 'triceps-pushdown', name: 'Triceps Pushdown', muscle: 'Triceps', equipment: 'Cable',
    repRange: { min: 10, max: 15 }, jointFriendly: true, startLb: 50,
    alternatives: ['overhead-triceps-ext', 'dips'],
    formGuide: [
      'Grip the bar or rope with elbows pinned to your sides.',
      'Push down until your arms are straight, squeezing the triceps.',
      'Let the handle rise back to chest height without moving your elbows.',
    ],
  },
  {
    id: 'overhead-triceps-ext', name: 'Overhead Triceps Extension', muscle: 'Triceps', equipment: 'Cable',
    repRange: { min: 10, max: 15 }, jointFriendly: true, startLb: 40,
    alternatives: ['triceps-pushdown', 'skull-crusher'],
    formGuide: [
      'Face away from a low pulley with the rope behind your head.',
      'Keep your elbows pointing forward and close to your head.',
      'Straighten your arms overhead, then lower until you feel a deep stretch.',
    ],
  },
  {
    id: 'skull-crusher', name: 'Skull Crusher', muscle: 'Triceps', equipment: 'Barbell',
    repRange: { min: 8, max: 12 }, jointFriendly: false, startLb: 55,
    alternatives: ['overhead-triceps-ext', 'triceps-pushdown'],
    formGuide: [
      'Lie flat holding an EZ bar over your chest.',
      'Bend only at the elbows to lower the bar behind your head.',
      'Straighten your arms back to the start.',
    ],
  },
  {
    id: 'dips', name: 'Weighted Dips', muscle: 'Triceps', equipment: 'Bodyweight',
    repRange: { min: 6, max: 12 }, jointFriendly: false, startLb: 25,
    alternatives: ['triceps-pushdown'],
    formGuide: [
      'Support yourself on the bars with arms straight and a belt with added weight.',
      'Lower until your upper arms are parallel to the floor.',
      'Press back up to straight arms.',
    ],
  },
  // Back
  {
    id: 'lat-pulldown', name: 'Lat Pulldown', muscle: 'Back', equipment: 'Cable',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 120,
    alternatives: ['assisted-pull-up', 'single-arm-pulldown'],
    formGuide: [
      'Grip the bar just outside shoulder width and lock your knees under the pad.',
      'Pull the bar to your upper chest, driving your elbows down.',
      'Let it rise slowly until your arms are straight.',
    ],
  },
  {
    id: 'assisted-pull-up', name: 'Weighted Pull-up', muscle: 'Back', equipment: 'Bodyweight',
    repRange: { min: 5, max: 10 }, jointFriendly: false, startLb: 10,
    alternatives: ['lat-pulldown'],
    formGuide: [
      'Hang from the bar with a shoulder-width grip and weight on a belt.',
      'Pull your chest towards the bar, leading with the elbows.',
      'Lower all the way to a dead hang.',
    ],
  },
  {
    id: 'single-arm-pulldown', name: 'Single-arm Pulldown', muscle: 'Back', equipment: 'Cable',
    repRange: { min: 10, max: 15 }, jointFriendly: true, startLb: 45,
    alternatives: ['lat-pulldown'],
    formGuide: [
      'Kneel under a high pulley and grip the handle with one hand.',
      'Pull your elbow down to your side.',
      'Reach up fully between reps.',
    ],
  },
  {
    id: 'barbell-row', name: 'Barbell Row', muscle: 'Back', equipment: 'Barbell',
    repRange: { min: 6, max: 10 }, jointFriendly: false, startLb: 135,
    alternatives: ['chest-supported-row', 'cable-row'],
    formGuide: [
      'Hinge forward to about 45° with a flat back and the bar at your knees.',
      'Row the bar to your lower ribs, squeezing your shoulder blades.',
      'Lower with control without standing up.',
    ],
  },
  {
    id: 'chest-supported-row', name: 'Chest-supported Row', muscle: 'Back', equipment: 'Dumbbell',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 45,
    alternatives: ['barbell-row', 'cable-row'],
    formGuide: [
      'Lie face down on an incline bench with dumbbells hanging below you.',
      'Row the weights up towards your hips.',
      'Lower fully to stretch your upper back.',
    ],
  },
  {
    id: 'cable-row', name: 'Seated Cable Row', muscle: 'Back', equipment: 'Cable',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 110,
    alternatives: ['chest-supported-row', 'barbell-row'],
    formGuide: [
      'Sit tall with a slight bend in the knees.',
      'Pull the handle to your stomach, keeping your chest up.',
      'Reach forward slowly to stretch your back.',
    ],
  },
  // Biceps
  {
    id: 'db-curl', name: 'Dumbbell Curl', muscle: 'Biceps', equipment: 'Dumbbell',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 30,
    alternatives: ['hammer-curl', 'cable-curl'],
    formGuide: [
      'Stand with dumbbells at your sides, palms forward.',
      'Curl up without letting your elbows drift forward.',
      'Lower slowly to straight arms.',
    ],
  },
  {
    id: 'hammer-curl', name: 'Hammer Curl', muscle: 'Biceps', equipment: 'Dumbbell',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 30,
    alternatives: ['db-curl', 'cable-curl'],
    formGuide: [
      'Hold the dumbbells with palms facing each other.',
      'Curl up, keeping your wrists neutral.',
      'Lower slowly.',
    ],
  },
  {
    id: 'cable-curl', name: 'Cable Curl', muscle: 'Biceps', equipment: 'Cable',
    repRange: { min: 10, max: 15 }, jointFriendly: true, startLb: 40,
    alternatives: ['db-curl', 'hammer-curl'],
    formGuide: [
      'Face a low pulley holding a straight bar.',
      'Curl the bar up, keeping your elbows at your sides.',
      'Lower until your arms are straight.',
    ],
  },
  // Legs
  {
    id: 'back-squat', name: 'Back Squat', muscle: 'Quads', equipment: 'Barbell',
    repRange: { min: 5, max: 8 }, jointFriendly: false, startLb: 185,
    alternatives: ['smith-squat', 'leg-press', 'hack-squat'],
    formGuide: [
      'Set the bar on your upper back and step back with feet shoulder width apart.',
      'Brace your core, then sit down and back between your hips.',
      'Go to at least parallel with knees tracking over your toes.',
      'Drive up through your whole foot.',
    ],
  },
  {
    id: 'smith-squat', name: 'Smith Machine Squat', muscle: 'Quads', equipment: 'Machine',
    repRange: { min: 6, max: 10 }, jointFriendly: false, startLb: 135,
    alternatives: ['back-squat', 'hack-squat', 'leg-press'],
    formGuide: [
      'Set the bar at shoulder height and step under it so it rests on your upper back.',
      'Place your feet slightly in front of the bar, shoulder width apart.',
      'Unhook the bar, brace, and sit down until your thighs are at least parallel.',
      'Drive up through your whole foot, then twist the bar back onto the hooks.',
    ],
    videoUrl: 'https://www.youtube.com/shorts/OwGx43UO_0Y',
  },
  {
    id: 'leg-press', name: 'Leg Press', muscle: 'Quads', equipment: 'Machine',
    repRange: { min: 10, max: 15 }, jointFriendly: true, startLb: 270,
    alternatives: ['back-squat', 'hack-squat'],
    formGuide: [
      'Place your feet shoulder width on the middle of the platform.',
      'Lower until your knees reach about 90° without your lower back lifting.',
      'Press back up without locking your knees.',
    ],
  },
  {
    id: 'hack-squat', name: 'Hack Squat', muscle: 'Quads', equipment: 'Machine',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 180,
    alternatives: ['leg-press', 'smith-squat', 'back-squat'],
    formGuide: [
      'Stand with your back on the pad and feet low on the platform.',
      'Squat down as deep as you can with control.',
      'Drive back up through your mid-foot.',
    ],
  },
  {
    id: 'leg-extension', name: 'Leg Extension', muscle: 'Quads', equipment: 'Machine',
    repRange: { min: 10, max: 20 }, jointFriendly: true, startLb: 100,
    alternatives: ['leg-press'],
    formGuide: [
      'Line your knees up with the machine pivot.',
      'Straighten your legs fully and pause.',
      'Lower slowly.',
    ],
  },
  {
    id: 'romanian-deadlift', name: 'Romanian Deadlift', muscle: 'Hamstrings', equipment: 'Barbell',
    repRange: { min: 6, max: 10 }, jointFriendly: false, startLb: 165,
    alternatives: ['db-rdl', 'seated-leg-curl'],
    formGuide: [
      'Stand holding the bar at your hips with soft knees.',
      'Push your hips back and slide the bar down your thighs.',
      'Stop when you feel a strong hamstring stretch, back still flat.',
      'Squeeze your glutes to stand back up.',
    ],
  },
  {
    id: 'db-rdl', name: 'Dumbbell Romanian Deadlift', muscle: 'Hamstrings', equipment: 'Dumbbell',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 50,
    alternatives: ['romanian-deadlift'],
    formGuide: [
      'Hold the dumbbells in front of your thighs.',
      'Hinge at the hips, keeping the weights close to your legs.',
      'Stand back up by driving your hips forward.',
    ],
  },
  {
    id: 'seated-leg-curl', name: 'Seated Leg Curl', muscle: 'Hamstrings', equipment: 'Machine',
    repRange: { min: 10, max: 15 }, jointFriendly: true, startLb: 90,
    alternatives: ['lying-leg-curl'],
    formGuide: [
      'Sit with the pad just above your heels and the thigh pad locked down.',
      'Curl your heels under the seat.',
      'Let the weight return slowly.',
    ],
  },
  {
    id: 'lying-leg-curl', name: 'Lying Leg Curl', muscle: 'Hamstrings', equipment: 'Machine',
    repRange: { min: 10, max: 15 }, jointFriendly: true, startLb: 70,
    alternatives: ['seated-leg-curl'],
    formGuide: [
      'Lie face down with the pad just above your heels.',
      'Curl the pad towards your glutes, hips pressed into the bench.',
      'Lower slowly.',
    ],
  },
  {
    id: 'hip-thrust', name: 'Hip Thrust', muscle: 'Glutes', equipment: 'Barbell',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 185,
    alternatives: ['romanian-deadlift', 'hip-abduction'],
    formGuide: [
      'Sit with your upper back against a bench and the bar over your hips.',
      'Drive through your heels to lift your hips until your body is flat.',
      'Pause and squeeze, then lower.',
    ],
  },
  {
    id: 'deadlift', name: 'Barbell Deadlift', muscle: 'Glutes', equipment: 'Barbell',
    repRange: { min: 6, max: 10 }, jointFriendly: false, startLb: 185,
    alternatives: ['romanian-deadlift', 'db-rdl', 'hip-thrust'],
    formGuide: [
      'Stand with the bar over the middle of your feet, feet hip-width apart.',
      'Hinge down and grip just outside your legs. Chest up, back flat, lats tight.',
      'Push the floor away and drive your hips forward, keeping the bar against your legs.',
      'Stand tall and squeeze your glutes, then hinge back down with the same flat back.',
    ],
  },
  {
    id: 'goblet-squat', name: 'Goblet Squat', muscle: 'Quads', equipment: 'Dumbbell',
    repRange: { min: 10, max: 15 }, jointFriendly: true, startLb: 50,
    alternatives: ['leg-press', 'smith-squat', 'hack-squat'],
    formGuide: [
      'Hold one dumbbell upright against your chest, elbows pointing down.',
      'Stand a little wider than shoulder width, toes turned slightly out.',
      'Sit down between your heels, keeping your chest up. The weight in front keeps your lower back neutral.',
      'Drive up through your whole foot and squeeze your glutes at the top.',
    ],
  },
  {
    id: 'hip-abduction', name: 'Hip Abduction Machine', muscle: 'Glutes', equipment: 'Machine',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 90,
    alternatives: ['hip-thrust'],
    formGuide: [
      'Sit with your back against the pad and the pads on the outside of your knees.',
      'Push your knees out as far as you can, leaning slightly forward to bias the glutes.',
      'Pause, then let your legs come back in slowly without letting the weights touch.',
    ],
  },
  {
    id: 'hip-adduction', name: 'Hip Adduction Machine', muscle: 'Adductors', equipment: 'Machine',
    repRange: { min: 8, max: 12 }, jointFriendly: true, startLb: 90,
    alternatives: ['goblet-squat'],
    formGuide: [
      'Sit with your back against the pad and the pads on the inside of your knees.',
      'Squeeze your knees together, working your inner thighs.',
      'Pause, then let your legs open slowly to a comfortable stretch.',
    ],
  },
  {
    id: 'leg-press-calf-raise', name: 'Leg Press Calf Raise', muscle: 'Calves', equipment: 'Machine',
    repRange: { min: 10, max: 15 }, jointFriendly: true, startLb: 180,
    alternatives: ['standing-calf-raise', 'seated-calf-raise'],
    formGuide: [
      'Sit in the leg press with the balls of your feet on the bottom edge of the platform, legs straight.',
      'Keep the safety catches on and your knees soft but locked in place.',
      'Lower your heels for a deep stretch, then press through your toes as far as you can.',
    ],
  },
  {
    id: 'standing-calf-raise', name: 'Standing Calf Raise', muscle: 'Calves', equipment: 'Machine',
    repRange: { min: 10, max: 20 }, jointFriendly: true, startLb: 150,
    alternatives: ['seated-calf-raise', 'leg-press-calf-raise'],
    formGuide: [
      'Stand on the edge of the platform with the pads on your shoulders.',
      'Lower your heels for a deep stretch.',
      'Rise as high as you can and pause.',
    ],
  },
  {
    id: 'seated-calf-raise', name: 'Seated Calf Raise', muscle: 'Calves', equipment: 'Machine',
    repRange: { min: 12, max: 20 }, jointFriendly: true, startLb: 90,
    alternatives: ['standing-calf-raise', 'leg-press-calf-raise'],
    formGuide: [
      'Sit with the pad on your lower thighs and the balls of your feet on the plate.',
      'Lower your heels, then press up as high as you can.',
    ],
  },
  // Core
  {
    id: 'cable-crunch', name: 'Cable Crunch', muscle: 'Core', equipment: 'Cable',
    repRange: { min: 10, max: 20 }, jointFriendly: true, startLb: 70,
    alternatives: ['hanging-leg-raise'],
    formGuide: [
      'Kneel under a high pulley holding a rope beside your head.',
      'Curl your ribs towards your hips.',
      'Return slowly without letting your hips move.',
    ],
  },
  {
    id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscle: 'Core', equipment: 'Bodyweight',
    repRange: { min: 8, max: 15 }, jointFriendly: false, startLb: 0,
    alternatives: ['cable-crunch'],
    formGuide: [
      'Hang from a bar with straight arms.',
      'Raise your knees or straight legs up by curling your pelvis.',
      'Lower slowly without swinging.',
    ],
  },
];
