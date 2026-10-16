import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Moment } from '@/types/moment';

type Props = {
  moment: Moment;
  onPress?: () => void;
};

export function MomentCard({ moment, onPress }: Props) {
  const { track, memo } = moment;

  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <Image source={{ uri: track.albumCoverUrl }} style={styles.albumCover} />

      <View style={styles.info}>
        <View>
          <Text style={styles.title} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>

        {memo ? (
          <Text style={styles.memo} numberOfLines={1}>
            {memo}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    height: 72,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#FFFFEB',
  },
  albumCover: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#E8E8E6',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 16,
    marginRight: 8,
    paddingVertical: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0801',
  },
  artist: {
    fontSize: 12,
    fontWeight: '500',
    color: '#95938B',
    marginTop: 2,
  },
  memo: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0A0801',
  },
});
