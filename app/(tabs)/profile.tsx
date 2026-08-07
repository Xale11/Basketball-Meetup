import { appVariant } from '@/constants/appVariant';
import { AC_ProfileHub } from '@/components/profile/AC_ProfileHub';
import BM_ProfileScreen from '@/components/profile/BM_ProfileScreen';

// Same variant split as app/(tabs)/index.tsx and clubs.tsx: ActivCampus gets the
// redesigned 4-tab hub, Basketball Meetup keeps its existing single-scroll screen.
export default appVariant === 'activCampus' ? AC_ProfileHub : BM_ProfileScreen;
