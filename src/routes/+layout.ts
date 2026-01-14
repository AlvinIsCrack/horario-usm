import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

import "$lib/helpers/extensions";

export const prerender = true;
export const trailingSlash = 'always';