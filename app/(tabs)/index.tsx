import { appVariant } from '@/constants/appVariant';
import BasketballHome from '@/components/home/BasketballHome';
import ActivCampusHome from '@/components/home/ActivCampusHome';

export default appVariant === 'activCampus' ? ActivCampusHome : BasketballHome;
