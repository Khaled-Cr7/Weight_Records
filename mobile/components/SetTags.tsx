import React from 'react';
import { Text, View } from 'react-native';
import { plural, setCounts } from '@/lib/routineFormat';
import { SET_STYLE } from '@/lib/setStyle';
import type { RoutineSet } from '@/services/types/program';

// "3 sets" in blue, "1 warm-up set" in amber, "1 drop set" in violet
export function SetTags({ sets }: { sets: RoutineSet[] }) {
  const { main, warmup, drop } = setCounts(sets);

  const tags = [
    main > 0 ? { type: 'NORMAL' as const, text: plural(main, 'set') } : null,
    warmup > 0 ? { type: 'WARMUP' as const, text: plural(warmup, 'warm-up set') } : null,
    drop > 0 ? { type: 'DROP' as const, text: plural(drop, 'drop set') } : null,
  ].filter((tag) => tag !== null);

  return (
    <View className="flex-row flex-wrap gap-2">
      {tags.map((tag) => {
        const style = SET_STYLE[tag.type];
        return (
          <View
            key={tag.type}
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: style.bg, borderWidth: 1, borderColor: style.border }}
          >
            <Text style={{ color: style.text }} className="text-xs font-semibold">{`${tag.text} `}</Text>
          </View>
        );
      })}
    </View>
  );
}