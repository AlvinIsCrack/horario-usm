import dayjs from 'dayjs';
import 'dayjs/locale/es-mx';
import relativeTime from 'dayjs/plugin/relativeTime';
import localeData from 'dayjs/plugin/localeData';

dayjs.extend(relativeTime);
dayjs.extend(localeData);

dayjs.locale('es-mx');

export default dayjs;