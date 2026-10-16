import * as Location from 'expo-location';

import type { Coordinates } from '@/types/moment';

export type CurrentPlace = {
  coordinates: Coordinates;
  /** 주소를 찾지 못하면 비어 있다 (웹은 주소 변환을 지원하지 않는다) */
  address?: string;
};

/**
 * 위치 권한을 요청하고 현재 위치를 가져온다.
 * 권한이 없거나 위치를 가져오지 못하면 undefined를 반환해 위치 없이 저장할 수 있게 한다.
 */
export async function getCurrentPlace(): Promise<CurrentPlace | undefined> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return undefined;

    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 60_000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

    const coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    return { coordinates, address: await toAddress(coordinates) };
  } catch {
    return undefined;
  }
}

/** 서울특별시 서초구 */
async function toAddress(coordinates: Coordinates) {
  try {
    const [place] = await Location.reverseGeocodeAsync(coordinates);
    if (!place) return undefined;

    const area = place.district ?? place.subregion ?? place.city;
    const parts = [place.region, area !== place.region ? area : null].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : undefined;
  } catch {
    return undefined;
  }
}
