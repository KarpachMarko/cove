import { Image, View } from 'react-native';
import { Music2 } from 'lucide-react-native';
import { useState } from 'react';
import { colors } from '../../theme/tokens';
export function Artwork({
  uri,
  size = 'small',
}: {
  uri?: string;
  size?: 'small' | 'large' | 'card';
}) {
  const [failedUri, setFailedUri] = useState<string>();
  const className = `${size === 'large' ? 'aspect-square w-full' : size === 'card' ? 'h-24 w-24' : 'h-12 w-12'} overflow-hidden rounded-xl bg-secondary`;
  return uri && failedUri !== uri ? (
    <Image
      source={{ uri }}
      onError={() => setFailedUri(uri)}
      accessible={false}
      className={className}
    />
  ) : (
    <View
      accessible={false}
      className={`${className} items-center justify-center`}
    >
      <Music2 size={size === 'large' ? 80 : 25} color={colors.primary} />
    </View>
  );
}
