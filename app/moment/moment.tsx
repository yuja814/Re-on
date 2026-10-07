import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MomentCard } from '@/components/moment/moment-card';
import { useMoments } from '@/stores/moment-store';
import type { Moment } from '@/types/moment';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type TimelineItem = {
  moment: Moment;
  /** 같은 날짜의 첫 기록에만 날짜를 표시한다 */
  date: { day: string; weekday: string } | null;
};

type TimelineSection = {
  title: string;
  data: TimelineItem[];
};

function toSections(moments: Moment[]): TimelineSection[] {
  const sorted = [...moments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const sections: TimelineSection[] = [];
  let prevDayKey = '';

  for (const moment of sorted) {
    const createdAt = new Date(moment.createdAt);
    const title = `${MONTHS[createdAt.getMonth()]} ${createdAt.getFullYear()}`;
    const dayKey = `${title}-${createdAt.getDate()}`;

    let section = sections[sections.length - 1];
    if (!section || section.title !== title) {
      section = { title, data: [] };
      sections.push(section);
    }

    section.data.push({
      moment,
      date:
        dayKey === prevDayKey
          ? null
          : {
              day: String(createdAt.getDate()).padStart(2, '0'),
              weekday: WEEKDAYS[createdAt.getDay()],
            },
    });
    prevDayKey = dayKey;
  }

  return sections;
}

export default function MomentScreen() {
  const router = useRouter();
  const sections = toSections(useMoments());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Moment</Text>
        {/* MVP에서는 보기 방식을 변경할 수 없고 현재 방식만 표시한다 */}
        <View style={styles.viewMode}>
          <Text style={styles.viewModeText}>Timeline</Text>
          <Ionicons name="chevron-down" size={12} color="#B7B6B1" />
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.moment.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={[styles.row, item.date && styles.rowFirstOfDay]}>
            <View style={styles.date}>
              {item.date ? (
                <>
                  <Text style={styles.dateText}>{item.date.day}</Text>
                  <Text style={styles.dateText}>{item.date.weekday}</Text>
                </>
              ) : null}
            </View>

            <View style={styles.cardWrapper}>
              <MomentCard
                moment={item.moment}
                onPress={() =>
                  router.push({ pathname: '/moment/[id]', params: { id: item.moment.id } })
                }
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              아직 기록이 없어요.{'\n'}음악 앱에서 첫 기록을 남겨보세요.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0B02',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8E8E6',
  },
  viewMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3A3936',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B7B6B1',
  },

  /* Timeline */
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8E8E6',
    marginTop: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginTop: 8,
  },
  rowFirstOfDay: {
    marginTop: 12,
  },
  date: {
    width: 74,
    alignItems: 'center',
    paddingTop: 10,
    paddingRight: 16,
    gap: 2,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8E8E6',
  },
  cardWrapper: {
    flex: 1,
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#E8E8E6',
    textAlign: 'center',
  },
});
