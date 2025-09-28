import dayjs from “dayjs”;
import utc from “dayjs/plugin/utc”;
import tz from “dayjs/plugin/timezone”;
dayjs.extend(utc); dayjs.extend(tz);

export function toBangkokIso(input: string | number | Date) {
return dayjs(input).tz(“Asia/Bangkok”).format(“YYYY-MM-DDTHH:mm:ss.SSSZ”);
}
