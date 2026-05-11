import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
} from '@ionic/react';
import { useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';

export const ApiKeyForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { setBackendUrl, setApiKey } = useSettingsStore();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    if (!url.trim()) {
      setError('Backend URL is required');
      return;
    }

    if (!key.trim()) {
      setError('API key is required');
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError('Invalid URL format');
      return;
    }

    setBackendUrl(url.trim());
    setApiKey(key.trim());
    onSuccess?.();
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Connect to Your Backend</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem>
          <IonLabel position="stacked">Backend URL</IonLabel>
          <IonInput
            value={url}
            onIonInput={(e) => setUrl(e.detail.value ?? '')}
            placeholder="https://your-railway-app.up.railway.app"
            type="url"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Admin API Key</IonLabel>
          <IonInput
            value={key}
            onIonInput={(e) => setKey(e.detail.value ?? '')}
            placeholder="Your API key"
            type="password"
          />
        </IonItem>

        {error && (
          <IonText color="danger">
            <p style={{ fontSize: 12, marginLeft: 16 }}>{error}</p>
          </IonText>
        )}

        <IonButton expand="block" onClick={handleSubmit} style={{ marginTop: 16 }}>
          Connect
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};
