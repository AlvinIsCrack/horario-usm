import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es-mx';

dayjs.extend(relativeTime);
dayjs.locale('es-mx', {}, false);

import "$lib/helpers/extensions";

export const prerender = true;
export const trailingSlash = 'always';