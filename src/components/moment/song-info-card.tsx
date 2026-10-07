import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { Track } from '@/types/moment';

type Props = {
  track: Track;
};

export function SongInfoCard({ track }: Props) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: track.albumCoverUrl }} style={styles.albumCover} />

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFEB',
  },
  albumCover: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: '#E8E8E6',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A0801',
  },
  artist: {
    fontSize: 14,
    fontWeight: '500',
    color: '#95938B',
  },
});
