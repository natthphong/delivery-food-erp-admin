import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export function toBangkokIso(input: string | number | Date): string {
  return dayjs(input).tz("Asia/Bangkok").format("YYYY-MM-DDTHH:mm:ss.SSSZ");
}
