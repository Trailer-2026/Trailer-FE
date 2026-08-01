import { useEffect, useState } from "react";

/**
 * 값이 delay(ms) 동안 변하지 않으면 그 값을 반영해 반환한다.
 * 검색어 입력처럼 매 키 입력마다 요청/연산이 나가는 걸 막을 때 사용.
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
