import { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../api/authService';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

type Stage = 'phone' | 'otp';

export const Login: React.FC = () => {
  const history = useHistory();
  const setSession = useAdminAuthStore((s) => s.setSession);

  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    setError('');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    try {
      setLoading(true);
      await sendOtp(phone);
      setStage('otp');
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP.');
      return;
    }
    try {
      setLoading(true);
      const res = await verifyOtp(phone, otp);
      setSession({ token: res.token, expiresAt: res.expiresAt, admin: res.admin });
      history.replace('/app/flows');
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Sign in</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          <h2 style={{ marginTop: 16 }}>Meetwave Admin</h2>
          <p style={{ color: 'var(--ion-color-medium)' }}>
            {stage === 'phone'
              ? 'Enter your admin mobile number to continue.'
              : `We sent a 6-digit code to +91 ${phone}.`}
          </p>

          {stage === 'phone' && (
            <IonItem>
              <IonLabel position="stacked">Mobile number</IonLabel>
              <IonInput
                type="tel"
                inputmode="numeric"
                maxlength={10}
                value={phone}
                onIonInput={(e) => setPhone(String(e.detail.value ?? '').replace(/\D/g, ''))}
                placeholder="9876543210"
              />
            </IonItem>
          )}

          {stage === 'otp' && (
            <IonItem>
              <IonLabel position="stacked">OTP</IonLabel>
              <IonInput
                type="tel"
                inputmode="numeric"
                maxlength={6}
                value={otp}
                onIonInput={(e) => setOtp(String(e.detail.value ?? '').replace(/\D/g, ''))}
                placeholder="123456"
              />
            </IonItem>
          )}

          {error && (
            <IonText color="danger">
              <p style={{ marginTop: 12 }}>{error}</p>
            </IonText>
          )}

          <IonButton
            expand="block"
            style={{ marginTop: 24 }}
            disabled={loading}
            onClick={stage === 'phone' ? handleSendOtp : handleVerify}
          >
            {loading ? <IonSpinner name="dots" /> : stage === 'phone' ? 'Send OTP' : 'Verify & Continue'}
          </IonButton>

          {stage === 'otp' && (
            <IonButton
              expand="block"
              fill="clear"
              disabled={loading}
              onClick={() => {
                setOtp('');
                setStage('phone');
              }}
            >
              Change number
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};
