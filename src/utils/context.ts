import type { Moment } from '@/types/moment';
import { getCurrentPlace } from '@/utils/location';

/** 위치를 기다리느라 저장이 늦어지지 않도록 이 시간이 지나면 위치 없이 저장한다 */
const LOCATION_TIMEOUT_MS = 3000;

export type MomentContext = Pick<Moment, 'createdAt' | 'location' | 'coordinates'>;

/**
 * Moment에 함께 저장할 Context(날짜·시간, 위치)를 모은다.
 * 기록 화면이 열릴 때 시작해 두고, 저장할 때 collect()로 결과를 받는다.
 */
export function startContextCollection() {
  // 메모를 쓰는 동안 위치 권한 요청과 위치 조회를 미리 진행한다
  const placePromise = getCurrentPlace();

  return {
    async collect(): Promise<MomentContext> {
      const place = await Promise.race([
        placePromise,
        new Promise<undefined>((resolve) => setTimeout(resolve, LOCATION_TIMEOUT_MS)),
      ]);

      return {
        // 날짜·시간은 저장 버튼을 누른 시점으로 자동 기록한다
        createdAt: new Date().toISOString(),
        location: place?.address,
        coordinates: place?.coordinates,
      };
    },
  };
}
