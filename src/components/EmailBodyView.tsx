import React, { useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { buildEmailHtmlPage } from './emailHtml';
import { colors, fontSize, spacing } from '../theme';

interface Props {
  body: string;
  autoHeight?: boolean;
}

// Lazy singleton — only resolved on native so it never throws on web.
let _WebView: any = null;
function getNativeWebView() {
  if (!_WebView) {
    _WebView = require('react-native-webview').default;
  }
  return _WebView;
}

export function EmailBodyView({ body, autoHeight = true }: Props) {
  const [webHeight, setWebHeight] = useState(400);

  if (!body?.trim()) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>This message has no content.</Text>
      </View>
    );
  }

  const html = buildEmailHtmlPage(body);

  // ── Web (browser) — render using a sandboxed <iframe> ─────────────────────
  if (Platform.OS === 'web') {
    return React.createElement('iframe', {
      srcDoc: html,
      style: {
        width: '100%',
        border: 'none',
        display: 'block',
        minHeight: '200px',
        height: autoHeight ? `${webHeight}px` : '100%',
        backgroundColor: 'transparent',
      } as React.CSSProperties,
      sandbox: 'allow-same-origin allow-popups allow-popups-to-escape-sandbox',
      title: 'email-content',
      onLoad: (e: React.SyntheticEvent<HTMLIFrameElement>) => {
        try {
          const f = e.target as HTMLIFrameElement;
          const h = f.contentDocument?.body?.scrollHeight;
          if (h && h > 0) {
            (f.style as any).height = `${h + 24}px`;
          }
        } catch {}
      },
    } as any) as any;
  }

  // ── Native (iOS / Android) — render using react-native-webview ─────────────
  const WebView = getNativeWebView();

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && data.value > 0) {
        setWebHeight(Math.min(data.value + 32, 8000));
      }
    } catch {}
  };

  if (autoHeight) {
    return (
      <View style={{ height: webHeight }}>
        <WebView
          source={{ html }}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
        />
      </View>
    );
  }

  return (
    <WebView
      source={{ html }}
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      scrollEnabled
      showsVerticalScrollIndicator={false}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
    />
  );
}

const s = StyleSheet.create({
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: fontSize.base, color: colors.textLight, fontStyle: 'italic' },
});
