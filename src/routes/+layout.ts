import dayjs from 'dayjs';

import relativeTime from 'dayjs/plugin/relativeTime';
import localeData from 'dayjs/plugin/localeData';

import 'dayjs/locale/es-mx';

dayjs.extend(relativeTime);
dayjs.extend(localeData);
dayjs.locale('es-mx');

import "$lib/helpers/extensions";

export const prerender = true;
export const trailingSlash = 'always';