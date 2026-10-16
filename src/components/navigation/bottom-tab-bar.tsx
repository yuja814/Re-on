import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export type TabName = 'memory' | 'moment' | 'me';

const ACTIVE_COLOR = '#FFFC36';
const INACTIVE_COLOR = '#E8E8E6';

// 아이콘 경로는 Figma Footer(203:1076)의 icon 벡터를 그대로 옮겼다
const TABS: { name: TabName; label: string; href: Href; path: string }[] = [
  {
    name: 'memory',
    label: 'Memory',
    href: '/memory/home',
    path: 'M15.8071 4.45685C13.8256 3.39831 9.92021 5.44366 8.79832 7.24431C8.29851 8.05007 8.33388 8.63073 8.33388 8.96017V26.5846L22.9792 35.8333L25.7332 34.3072V17.1431L10.6964 8.38112C11.5033 7.35045 13.318 6.09365 14.6788 6.59841L28.0723 13.8685L28.0724 32.9894L30.8333 31.4605V12.34L15.8071 4.45685Z',
  },
  {
    name: 'moment',
    label: '기록',
    href: '/moment/moment',
    path: 'M34.8918 9.57047L31.5458 6.25644C31.2582 5.98485 30.8761 5.83333 30.4787 5.83333C30.0814 5.83333 29.6992 5.98485 29.4116 6.25644L26.4364 9.2122H10.4753C9.99562 9.2122 9.53559 9.40093 9.1964 9.73688C8.85722 10.0728 8.66667 10.5285 8.66667 11.0036V30.7086C8.66667 31.1837 8.85722 31.6394 9.1964 31.9753C9.53559 32.3113 9.99562 32.5 10.4753 32.5H30.3702C30.8499 32.5 31.3099 32.3113 31.6491 31.9753C31.9883 31.6394 32.1788 31.1837 32.1788 30.7086V14.3713L34.8918 11.6843C35.1745 11.4038 35.3333 11.0237 35.3333 10.6274C35.3333 10.2311 35.1745 9.85092 34.8918 9.57047ZM22.0777 21.8682L18.2886 22.7012L19.1929 18.9841L27.8291 10.4124L30.75 13.3055L22.0777 21.8682ZM31.7267 12.2844L28.8058 9.39133L30.4787 7.73432L33.3997 10.6274L31.7267 12.2844Z',
  },
  {
    name: 'me',
    label: '내 정보',
    href: '/user/me',
    path: 'M8.33333 34C8.33333 34 6 34 6 31.6667C6 29.3333 8.33333 22.3333 20 22.3333C31.6667 22.3333 34 29.3333 34 31.6667C34 34 31.6667 34 31.6667 34H8.33333ZM20 20C21.8565 20 23.637 19.2625 24.9497 17.9497C26.2625 16.637 27 14.8565 27 13C27 11.1435 26.2625 9.36301 24.9497 8.05025C23.637 6.7375 21.8565 6 20 6C18.1435 6 16.363 6.7375 15.0503 8.05025C13.7375 9.36301 13 11.1435 13 13C13 14.8565 13.7375 16.637 15.0503 17.9497C16.363 19.2625 18.1435 20 20 20Z',
  },
];

type Props = {
  active: TabName;
};

/** 하단 탭바 (Figma Footer). 화면 아래에 떠 있으므로 화면 콘텐츠는 아래 여백을 남겨야 한다. */
export function BottomTabBar({ active }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 30) }]}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.name === active;
          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                // 탭 이동은 기록을 쌓지 않고 화면을 바꾼다
                if (!isActive) router.replace(tab.href);
              }}
              hitSlop={8}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}>
              <Svg width={40} height={40} viewBox="0 0 40 40">
                <Path d={tab.path} fill={isActive ? ACTIVE_COLOR : INACTIVE_COLOR} />
              </Svg>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 40,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(232, 232, 230, 0.2)',
    backgroundColor: 'rgba(10, 8, 1, 0.2)',
  },
});
