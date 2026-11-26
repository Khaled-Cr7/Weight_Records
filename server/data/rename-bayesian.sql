UPDATE exercises
SET name = 'One Arm Bayesian Curl',
    level = 'intermediate',
    instructions = ARRAY[
      'Stand with your back to a low pulley, holding a single handle in one hand. Step forward until the cable is under tension with your arm extended behind your body.',
      'Keep your elbow slightly behind your torso and your feet stable. Rest your free hand on your hip or a support for balance. This is your starting position, with the biceps in a deep stretch.',
      'Curl the handle forward and up toward your shoulder while keeping your upper arm still. Exhale as you curl.',
      'Squeeze the biceps hard at the top for a second.',
      'Slowly lower the handle back to the starting position until the biceps is fully stretched. Inhale as you lower.',
      'Repeat for the recommended number of repetitions, then switch arms.',
      'Tip: Do not swing your torso or let the elbow drift forward. The stretch under load is what makes this variation work.'
    ]
WHERE id = 'One_Arm_Cable_Curl';