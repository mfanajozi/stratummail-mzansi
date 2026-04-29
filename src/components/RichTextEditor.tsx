import React, { useRef, useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { EDITOR_HTML } from './editorHtml';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

// Lazy singleton — only resolved on native.
let _WebView: any = null;
function getNativeWebView() {
  if (!_WebView) {
    _WebView = require('react-native-webview').default;
  }
  return _WebView;
}

export function RichTextEditor({ value, onChange, minHeight = 200 }: Props) {
  const isWeb = Platform.OS === 'web';

  // Refs used by whichever platform is active
  const iframeRef = useRef<any>(null);
  const webviewRef = useRef<any>(null);
  const lastValue = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [nativeReady, setNativeReady] = useState(false);

  // ── Web: listen for postMessage from iframe ────────────────────────────────
  useEffect(() => {
    if (!isWeb) return;
    const handler = (e: MessageEvent) => {
      try {
        const raw = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
        const data = JSON.parse(raw);
        if (data.t === 'ch') {
          lastValue.current = data.h;
          onChangeRef.current(data.h);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isWeb]);

  // ── Web: push value into iframe when it changes externally ─────────────────
  useEffect(() => {
    if (!isWeb) return;
    if (value !== lastValue.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ t: 'set', h: value || '' }), '*'
      );
      lastValue.current = value;
    }
  }, [isWeb, value]);

  // ── Native: push value into WebView when it changes externally ─────────────
  useEffect(() => {
    if (isWeb || !nativeReady) return;
    if (value !== lastValue.current) {
      webviewRef.current?.postMessage(JSON.stringify({ t: 'set', h: value || '' }));
      lastValue.current = value;
    }
  }, [isWeb, value, nativeReady]);

  // ── Web render ─────────────────────────────────────────────────────────────
  if (isWeb) {
    const handleLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      const f = e.target as HTMLIFrameElement;
      iframeRef.current = f;
      setTimeout(() => {
        f.contentWindow?.postMessage(JSON.stringify({ t: 'set', h: value || '' }), '*');
        lastValue.current = value;
      }, 80);
    };

    return React.createElement(
      'div',
      {
        style: {
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1.5px solid #E2E8F0',
          backgroundColor: '#fff',
          minHeight: `${minHeight}px`,
        } as React.CSSProperties,
      },
      React.createElement('iframe', {
        srcDoc: EDITOR_HTML,
        style: {
          width: '100%',
          minHeight: `${minHeight}px`,
          height: `${minHeight}px`,
          border: 'none',
          display: 'block',
        } as React.CSSProperties,
        title: 'signature-editor',
        onLoad: handleLoad,
      } as any)
    ) as any;
  }

  // ── Native render ──────────────────────────────────────────────────────────
  const WebView = getNativeWebView();

  const handleNativeLoad = () => {
    setNativeReady(true);
    setTimeout(() => {
      webviewRef.current?.postMessage(JSON.stringify({ t: 'set', h: value || '' }));
      lastValue.current = value;
    }, 80);
  };

  const handleNativeMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.t === 'ch') {
        lastValue.current = data.h;
        onChangeRef.current(data.h);
      }
    } catch {}
  };

  return (
    <View style={[s.wrap, { minHeight }]}>
      <WebView
        ref={webviewRef}
        source={{ html: EDITOR_HTML }}
        onLoad={handleNativeLoad}
        onMessage={handleNativeMessage}
        style={s.webview}
        scrollEnabled
        showsVerticalScrollIndicator={false}
        keyboardDisplayRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
