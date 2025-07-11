import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, MapPin, DollarSign, Crown, Calendar, Settings } from 'lucide-react-native';
import { Club } from '@/types';

interface ClubCardProps {
  club: Club;
  onPress: () => void;
  showJoinButton?: boolean;
  isMember?: boolean;
  isAdmin?: boolean;
}

export function ClubCard({ club, onPress, showJoinButton = false, isMember = false, isAdmin = false }: ClubCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.clubInfo}>
          <View style={styles.logoContainer}>
            {club.logo ? (
              <Image source={{ uri: club.logo }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>{club.name.charAt(0)}</Text>
              </View>
            )}
          </View>
          <View style={styles.details}>
            <View style={styles.titleRow}>
              <Text style={styles.name}>{club.name}</Text>
              {isAdmin && <Crown size={16} color="#FFD700" />}
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {club.description}
            </Text>
          </View>
        </View>
        
        {isAdmin && (
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Users size={16} color="#666" />
          <Text style={styles.statText}>{club.members.length} members</Text>
        </View>
        <View style={styles.stat}>
          <Calendar size={16} color="#666" />
          <Text style={styles.statText}>{club.trainingSchedule.length} sessions/week</Text>
        </View>
      </View>

      <View style={styles.feesRow}>
        <View style={styles.feeItem}>
          <DollarSign size={16} color="#FF6B35" />
          <Text style={styles.feeText}>
            ${club.fees.monthly}/month
          </Text>
        </View>
        <View style={styles.feeItem}>
          <DollarSign size={16} color="#FF6B35" />
          <Text style={styles.feeText}>
            ${club.fees.session}/session
          </Text>
        </View>
      </View>

      <View style={styles.courtsSection}>
        <MapPin size={16} color="#666" />
        <Text style={styles.courtsText}>
          {club.courtIds.length} training {club.courtIds.length === 1 ? 'location' : 'locations'}
        </Text>
      </View>

      {showJoinButton && !isMember && (
        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Join Club</Text>
        </TouchableOpacity>
      )}

      {isMember && (
        <View style={styles.memberBadge}>
          <Text style={styles.memberBadgeText}>Member</Text>
        </View>
      )}

      {isAdmin && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Users size={16} color="#FF6B35" />
            <Text style={styles.actionButtonText}>Manage Players</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Calendar size={16} color="#FF6B35" />
            <Text style={styles.actionButtonText}>Schedule Training</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clubInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  details: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  feesRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  feeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  feeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 4,
  },
  courtsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  courtsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  joinButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  memberBadgeText: {
    color: '#28A745',
    fontSize: 14,
    fontWeight: '600',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 6,
  },
});