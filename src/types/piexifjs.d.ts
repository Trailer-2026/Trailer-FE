/**
 * piexifjs 최소 타입 선언(공식 타입 미제공).
 * 렌더 업로드 전 리사이즈된 JPEG 에 GPS/촬영시각 EXIF 를 재주입하는 데 쓰는 부분만 선언.
 */
declare module "piexifjs" {
  /** IFD 태그 상수 맵(태그명 → 숫자 키) */
  export const GPSIFD: Record<string, number>;
  export const ImageIFD: Record<string, number>;
  export const ExifIFD: Record<string, number>;

  export const GPSHelper: {
    /** 십진 도 → [[분자, 분모], ...] (도/분/초 rational 3쌍) */
    degToDmsRational(deg: number): number[][];
  };

  /** EXIF 객체 → 바이너리 문자열 */
  export function dump(exifObj: unknown): string;
  /** EXIF 바이너리 문자열을 JPEG(data URI 또는 바이너리 문자열)에 삽입 */
  export function insert(exifStr: string, jpegData: string): string;
  export function load(jpegData: string): unknown;
  export function remove(jpegData: string): string;

  const piexif: {
    GPSIFD: typeof GPSIFD;
    ImageIFD: typeof ImageIFD;
    ExifIFD: typeof ExifIFD;
    GPSHelper: typeof GPSHelper;
    dump: typeof dump;
    insert: typeof insert;
    load: typeof load;
    remove: typeof remove;
  };
  export default piexif;
}
