import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Artwork } from '../../components/ui/artwork';
import { Text } from '../../components/ui/text';
import { colors } from '../../theme/tokens';
export function EntityRow({
  title,
  subtitle,
  artwork,
  onPress,
}: {
  title: string;
  subtitle?: string;
  artwork?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}`}
      className="min-h-16 flex-row items-center gap-3 border-b border-line px-5 py-3 active:bg-secondary"
    >
      <Artwork uri={artwork} />
      <View className="flex-1 gap-1">
        <Text variant="label">{title}</Text>
        {subtitle && <Text variant="caption">{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </Pressable>
  );
}
