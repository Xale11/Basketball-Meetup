import { appVariant } from '@/constants/appVariant';
import BasketballClubsScreen from '@/components/clubs/BasketballClubsScreen';
import SocietiesScreen from '@/components/societies/SocietiesScreen';

export default appVariant === 'activCampus' ? SocietiesScreen : BasketballClubsScreen;
