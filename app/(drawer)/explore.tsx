import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function ExploreScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Keşfet
        </ThemedText>
      </ThemedView>
      <ThemedText>Bu uygulama başlamanıza yardımcı olacak örnek kodlar içerir.</ThemedText>
      <Collapsible title="Dosya Tabanlı Yönlendirme">
        <ThemedText>
          Bu uygulamanın dört ekranı var:{' '}
          <ThemedText type="defaultSemiBold">app/(drawer)/index.tsx</ThemedText>,{' '}
          <ThemedText type="defaultSemiBold">app/(drawer)/explore.tsx</ThemedText>,{' '}
          <ThemedText type="defaultSemiBold">app/(drawer)/profile.tsx</ThemedText> ve{' '}
          <ThemedText type="defaultSemiBold">app/(drawer)/settings.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          <ThemedText type="defaultSemiBold">app/(drawer)/_layout.tsx</ThemedText> dosyasındaki layout dosyası{' '}
          drawer navigatörünü kurar.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Daha fazla bilgi</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS ve Web Desteği">
        <ThemedText>
          Bu projeyi Android, iOS ve web&apos;de açabilirsiniz. Web sürümünü açmak için bu projeyi çalıştıran terminalde{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> tuşuna basın.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Görüntüler">
        <ThemedText>
          Statik görüntüler için, farklı ekran yoğunlukları için dosyalar sağlamak üzere{' '}
          <ThemedText type="defaultSemiBold">@2x</ThemedText> ve{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> son eklerini kullanabilirsiniz
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Daha fazla bilgi</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Açık ve Koyu Mod Bileşenleri">
        <ThemedText>
          Bu şablon açık ve koyu mod desteğine sahiptir.{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook&apos;u kullanıcının mevcut renk şemasını{' '}
          incelemenizi sağlar ve böylece UI renklerini buna göre ayarlayabilirsiniz.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Daha fazla bilgi</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animasyonlar">
        <ThemedText>
          Bu şablon animasyonlu bir bileşen örneği içerir.{' '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> bileşeni{' '}
          el sallama animasyonu oluşturmak için güçlü{' '}
          <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
            react-native-reanimated
          </ThemedText>{' '}
          kütüphanesini kullanır.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
              bileşeni başlık görüntüsü için parallax efekti sağlar.
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
