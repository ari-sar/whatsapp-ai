import { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { listPlans } from '../api/plansService';
import { listFlows } from '../api/flowsService';
import { createOrder, verifyPayment } from '../api/paymentService';
import { completeOnboarding } from '../api/userService';
import { openRazorpayCheckout } from '../lib/razorpay';
import { useAuthStore } from '../store/useAuthStore';
import { Plan } from '../types/plan';
import { BusinessFlow } from '../types/flow';

const formatPrice = (paise: number, currency: string) =>
  `${currency === 'INR' ? '₹' : currency} ${(paise / 100).toLocaleString('en-IN')}`;

export const Onboarding: React.FC = () => {
  const history = useHistory();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [flows, setFlows] = useState<BusinessFlow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [businessTypeId, setBusinessTypeId] = useState('');
  const [planId, setPlanId] = useState('');

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [f, p] = await Promise.all([listFlows(), listPlans()]);
        setFlows(f);
        setPlans(p);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load onboarding data');
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  const selectedPlan = plans.find((p) => p.id === planId);

  const validate = (): string | null => {
    if (!name.trim()) return 'Please enter your name.';
    if (!businessName.trim()) return 'Please enter your business name.';
    if (!businessTypeId) return 'Please select a business type.';
    if (!planId) return 'Please select a plan.';
    return null;
  };

  const handlePay = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const order = await createOrder(planId);
      const payment = await openRazorpayCheckout({
        order,
        prefill: { name, contact: user?.phone, email: '' },
        notes: { businessName, businessTypeId, planId },
        description: selectedPlan ? `${selectedPlan.name} plan` : 'Subscription',
      });
      const { verified } = await verifyPayment(payment);
      if (!verified) {
        setError('Payment could not be verified. Please contact support.');
        return;
      }
      const updated = await completeOnboarding({
        name,
        businessName,
        businessTypeId,
        planId,
        paymentId: payment.razorpayPaymentId,
        orderId: payment.razorpayOrderId,
      });
      setUser(updated);
      history.replace('/app/home');
    } catch (err: any) {
      setError(err.message ?? 'Onboarding failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Set up your account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          {loadingMeta ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <IonSpinner name="dots" />
            </div>
          ) : (
            <>
              <h2>Tell us about your business</h2>

              <IonItem>
                <IonLabel position="stacked">Your name</IonLabel>
                <IonInput value={name} onIonInput={(e) => setName(String(e.detail.value ?? ''))} placeholder="Full name" />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Business name</IonLabel>
                <IonInput
                  value={businessName}
                  onIonInput={(e) => setBusinessName(String(e.detail.value ?? ''))}
                  placeholder="Your business / shop"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Business type & flow</IonLabel>
                <IonSelect
                  value={businessTypeId}
                  placeholder="Choose business type"
                  onIonChange={(e) => setBusinessTypeId(e.detail.value)}
                >
                  {flows.map((f) => (
                    <IonSelectOption key={f.id} value={f.id}>
                      {f.businessType} — {f.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Plan</IonLabel>
                <IonSelect
                  value={planId}
                  placeholder="Choose a plan"
                  onIonChange={(e) => setPlanId(e.detail.value)}
                >
                  {plans.map((p) => (
                    <IonSelectOption key={p.id} value={p.id}>
                      {p.name} — {formatPrice(p.priceInPaise, p.currency)}/{p.billingCycle === 'monthly' ? 'mo' : p.billingCycle === 'yearly' ? 'yr' : 'once'}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              {selectedPlan && (
                <IonCard>
                  <IonCardContent>
                    <strong>{selectedPlan.name}</strong>
                    <div style={{ fontSize: 22, fontWeight: 600, margin: '4px 0' }}>
                      {formatPrice(selectedPlan.priceInPaise, selectedPlan.currency)}
                      <span style={{ fontSize: 12, color: 'var(--ion-color-medium)', fontWeight: 400 }}>
                        {' '}/ {selectedPlan.billingCycle}
                      </span>
                    </div>
                    <ul style={{ paddingLeft: 18, margin: '8px 0 0', color: 'var(--ion-color-medium)' }}>
                      {selectedPlan.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </IonCardContent>
                </IonCard>
              )}

              {error && (
                <IonText color="danger">
                  <p style={{ marginTop: 12 }}>{error}</p>
                </IonText>
              )}

              <IonButton expand="block" style={{ marginTop: 16 }} onClick={handlePay} disabled={submitting}>
                {submitting ? <IonSpinner name="dots" /> : selectedPlan ? `Pay ${formatPrice(selectedPlan.priceInPaise, selectedPlan.currency)} & onboard` : 'Pay & onboard'}
              </IonButton>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};
