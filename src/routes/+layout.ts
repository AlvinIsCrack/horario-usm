import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es-mx';
import localeData from 'dayjs/plugin/localeData';

dayjs.locale('es-mx');
dayjs.extend(relativeTime);
dayjs.extend(localeData);

import "$lib/helpers/extensions";