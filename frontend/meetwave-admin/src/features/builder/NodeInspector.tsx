import {
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonList,
  IonListHeader,
  IonNote,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { add, trash } from 'ionicons/icons';
import { Node, Edge } from '@xyflow/react';

interface Props {
  node: Node | null;
  edges: Edge[];
  onPatchData: (patch: Record<string, any>) => void;
  onRename: (newId: string) => void;
  onUpdateEdgeCondition: (edgeId: string, condition: any | null) => void;
  onDeleteEdge: (edgeId: string) => void;
}

const SOURCE_OPTIONS = [
  { value: 'serviceable_pincodes', label: 'Shop owner — Serviceable pincodes' },
];

const CHECK_OPERATORS = [
  { value: 'equals', label: 'equals (value)' },
  { value: 'not_equals', label: 'does not equal (value)' },
  { value: 'in_list', label: 'is in list (literal values)' },
  { value: 'not_in_list', label: 'is NOT in list (literal values)' },
  { value: 'contains', label: 'contains substring' },
  { value: 'regex', label: 'matches regex' },
  { value: 'in_source', label: 'is in source (per-tenant DB list)' },
  { value: 'not_in_source', label: 'is NOT in source (per-tenant DB list)' },
];

const conditionOptionsForType = (type: string): Array<{ value: string; label: string }> => {
  if (type === 'check') {
    return [
      { value: '__default__', label: 'Pass (true)' },
      { value: 'check_pass', label: 'Pass (true)' },
      { value: 'check_fail', label: 'Fail (false)' },
    ];
  }
  return [
    { value: '__default__', label: 'Default (unconditional)' },
    { value: 'input_eq', label: 'Input equals' },
    { value: 'input_in', label: 'Input is one of' },
    { value: 'collected_eq', label: 'Collected key equals' },
  ];
};

export const NodeInspector: React.FC<Props> = ({ node, edges, onPatchData, onRename, onUpdateEdgeCondition, onDeleteEdge }) => {
  if (!node) {
    return (
      <div style={{ padding: 16, color: 'var(--ion-color-medium)' }}>
        <p>Select a node to edit its config.</p>
        <p style={{ fontSize: 12 }}>Drag from the dot below a node to the dot above another node to create a transition.</p>
      </div>
    );
  }

  const d = (node.data ?? {}) as any;
  const type = d.type ?? node.type ?? 'text';
  const outgoing = edges.filter((e) => e.source === node.id);

  const updateSection = (idx: number, patch: any) => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    sections[idx] = { ...sections[idx], ...patch };
    onPatchData({ sections });
  };
  const addSection = () => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    sections.push({ title: 'Section', rows: [] });
    onPatchData({ sections });
  };
  const deleteSection = (idx: number) => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    sections.splice(idx, 1);
    onPatchData({ sections });
  };
  const updateRow = (si: number, ri: number, patch: any) => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    const rows = [...(sections[si]?.rows ?? [])];
    rows[ri] = { ...rows[ri], ...patch };
    sections[si] = { ...sections[si], rows };
    onPatchData({ sections });
  };
  const addRow = (si: number) => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    const rows = [...(sections[si]?.rows ?? [])];
    rows.push({ id: `opt_${rows.length + 1}`, title: 'New option' });
    sections[si] = { ...sections[si], rows };
    onPatchData({ sections });
  };
  const deleteRow = (si: number, ri: number) => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    const rows = [...(sections[si]?.rows ?? [])];
    rows.splice(ri, 1);
    sections[si] = { ...sections[si], rows };
    onPatchData({ sections });
  };

  const updateButton = (idx: number, patch: any) => {
    const buttons = Array.isArray(d.buttons) ? [...d.buttons] : [];
    buttons[idx] = { ...buttons[idx], ...patch };
    onPatchData({ buttons });
  };
  const addButton = () => {
    const buttons = Array.isArray(d.buttons) ? [...d.buttons] : [];
    if (buttons.length >= 3) return;
    buttons.push({ id: `btn_${buttons.length + 1}`, title: 'Button' });
    onPatchData({ buttons });
  };
  const deleteButton = (idx: number) => {
    const buttons = Array.isArray(d.buttons) ? [...d.buttons] : [];
    buttons.splice(idx, 1);
    onPatchData({ buttons });
  };

  const handleConditionTypeChange = (edge: Edge, newType: string) => {
    if (newType === '__default__') {
      onUpdateEdgeCondition(edge.id, null);
      return;
    }
    const existing = (edge.data as any)?.condition ?? {};
    let next: any;
    switch (newType) {
      case 'input_eq':
        next = { type: 'input_eq', value: existing.value ?? '' };
        break;
      case 'input_in':
        next = { type: 'input_in', values: Array.isArray(existing.values) ? existing.values : [] };
        break;
      case 'collected_eq':
        next = { type: 'collected_eq', key: existing.key ?? '', value: existing.value ?? '' };
        break;
      case 'check_pass':
        next = { type: 'check_pass' };
        break;
      case 'check_fail':
        next = { type: 'check_fail' };
        break;
      default:
        next = null;
    }
    onUpdateEdgeCondition(edge.id, next);
  };

  const patchCondition = (edge: Edge, patch: any) => {
    const existing = (edge.data as any)?.condition ?? {};
    onUpdateEdgeCondition(edge.id, { ...existing, ...patch });
  };

  const renderConditionFields = (edge: Edge) => {
    const c = (edge.data as any)?.condition;
    if (!c) return null;
    if (c.type === 'input_eq') {
      return (
        <IonItem>
          <IonLabel position="stacked">Match value</IonLabel>
          <IonInput
            value={c.value ?? ''}
            placeholder="e.g. yes / confirm_yes"
            onIonInput={(e) => patchCondition(edge, { value: e.detail.value ?? '' })}
          />
        </IonItem>
      );
    }
    if (c.type === 'input_in') {
      const text = Array.isArray(c.values) ? c.values.join('\n') : '';
      return (
        <IonItem>
          <IonLabel position="stacked">Match any of (one per line)</IonLabel>
          <IonTextarea
            autoGrow
            value={text}
            placeholder={'yes\nok\nconfirm'}
            onIonInput={(e) => {
              const raw = String(e.detail.value ?? '');
              const values = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
              patchCondition(edge, { values });
            }}
          />
        </IonItem>
      );
    }
    if (c.type === 'collected_eq') {
      return (
        <>
          <IonItem>
            <IonLabel position="stacked">Collected key</IonLabel>
            <IonInput
              value={c.key ?? ''}
              placeholder="e.g. plan_type"
              onIonInput={(e) => patchCondition(edge, { key: e.detail.value ?? '' })}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Equals value</IonLabel>
            <IonInput
              value={c.value ?? ''}
              onIonInput={(e) => patchCondition(edge, { value: e.detail.value ?? '' })}
            />
          </IonItem>
        </>
      );
    }
    return null;
  };

  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      <IonList>
        <IonListHeader>
          <IonLabel>{type.toUpperCase()} step</IonLabel>
        </IonListHeader>
        <IonItem>
          <IonLabel position="stacked">Step ID</IonLabel>
          <IonInput
            value={node.id}
            onIonBlur={(e) => {
              const v = String((e.target as HTMLIonInputElement).value ?? '').trim();
              if (v && v !== node.id) onRename(v);
            }}
          />
          <IonNote slot="helper">Stable identifier. Changing breaks active conversations.</IonNote>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Label</IonLabel>
          <IonInput
            value={d.label ?? ''}
            onIonInput={(e) => onPatchData({ label: e.detail.value ?? '' })}
          />
        </IonItem>

        {(type === 'text' || type === 'list' || type === 'button' || type === 'end') && (
          <IonItem>
            <IonLabel position="stacked">Prompt</IonLabel>
            <IonTextarea
              autoGrow
              value={d.prompt ?? ''}
              onIonInput={(e) => onPatchData({ prompt: e.detail.value ?? '' })}
            />
            <IonNote slot="helper">Use {'{{var}}'} to interpolate collected_data.</IonNote>
          </IonItem>
        )}

        {type === 'text' && (
          <>
            <IonItem>
              <IonLabel position="stacked">Validation regex (optional)</IonLabel>
              <IonInput
                value={d.validation ?? ''}
                onIonInput={(e) => onPatchData({ validation: e.detail.value ?? '' })}
                placeholder="^\\d{6}$"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Collect into key</IonLabel>
              <IonInput
                value={d.collectKey ?? ''}
                onIonInput={(e) => onPatchData({ collectKey: e.detail.value ?? '' })}
                placeholder="pincode"
              />
            </IonItem>
          </>
        )}

        {(type === 'text' || type === 'list' || type === 'button') && (
          <IonItem>
            <IonLabel position="stacked">Invalid message (re-prompt)</IonLabel>
            <IonTextarea
              autoGrow
              value={d.invalidMessage ?? ''}
              onIonInput={(e) => onPatchData({ invalidMessage: e.detail.value ?? '' })}
            />
          </IonItem>
        )}

        {type === 'list' && (
          <>
            <IonItem>
              <IonLabel position="stacked">Button label</IonLabel>
              <IonInput
                value={d.buttonLabel ?? ''}
                onIonInput={(e) => onPatchData({ buttonLabel: e.detail.value ?? '' })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Collect option id into key</IonLabel>
              <IonInput
                value={d.collectKey ?? ''}
                onIonInput={(e) => onPatchData({ collectKey: e.detail.value ?? '' })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Collect option label into key</IonLabel>
              <IonInput
                value={d.collectLabelKey ?? ''}
                onIonInput={(e) => onPatchData({ collectLabelKey: e.detail.value ?? '' })}
              />
            </IonItem>
            <IonListHeader>
              <IonLabel>Sections</IonLabel>
              <IonButton fill="clear" size="small" onClick={addSection}>
                <IonIcon icon={add} slot="start" />
                Add section
              </IonButton>
            </IonListHeader>
            {(d.sections ?? []).map((sec: any, si: number) => (
              <div key={si} style={{ padding: '8px 16px', borderTop: '1px solid var(--ion-color-light)' }}>
                <IonItem>
                  <IonLabel position="stacked">Section title</IonLabel>
                  <IonInput
                    value={sec.title ?? ''}
                    onIonInput={(e) => updateSection(si, { title: e.detail.value ?? '' })}
                  />
                  <IonButton slot="end" fill="clear" color="danger" onClick={() => deleteSection(si)}>
                    <IonIcon icon={trash} />
                  </IonButton>
                </IonItem>
                {(sec.rows ?? []).map((row: any, ri: number) => (
                  <div key={ri} style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
                    <IonInput
                      value={row.id ?? ''}
                      placeholder="id"
                      onIonInput={(e) => updateRow(si, ri, { id: e.detail.value ?? '' })}
                    />
                    <IonInput
                      value={row.title ?? ''}
                      placeholder="title (max 24 chars)"
                      onIonInput={(e) => updateRow(si, ri, { title: e.detail.value ?? '' })}
                    />
                    <IonButton fill="clear" color="danger" onClick={() => deleteRow(si, ri)}>
                      <IonIcon icon={trash} />
                    </IonButton>
                  </div>
                ))}
                <IonButton fill="clear" size="small" onClick={() => addRow(si)}>
                  <IonIcon icon={add} slot="start" />
                  Add row
                </IonButton>
              </div>
            ))}
          </>
        )}

        {type === 'button' && (
          <>
            <IonItem>
              <IonLabel position="stacked">Collect chosen button id into key</IonLabel>
              <IonInput
                value={d.collectKey ?? ''}
                onIonInput={(e) => onPatchData({ collectKey: e.detail.value ?? '' })}
              />
            </IonItem>
            <IonListHeader>
              <IonLabel>Buttons (max 3)</IonLabel>
              <IonButton fill="clear" size="small" onClick={addButton} disabled={(d.buttons?.length ?? 0) >= 3}>
                <IonIcon icon={add} slot="start" />
                Add button
              </IonButton>
            </IonListHeader>
            {(d.buttons ?? []).map((b: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', gap: 8, padding: '4px 16px' }}>
                <IonInput
                  value={b.id ?? ''}
                  placeholder="id"
                  onIonInput={(e) => updateButton(idx, { id: e.detail.value ?? '' })}
                />
                <IonInput
                  value={b.title ?? ''}
                  placeholder="title (max 20 chars)"
                  onIonInput={(e) => updateButton(idx, { title: e.detail.value ?? '' })}
                />
                <IonButton fill="clear" color="danger" onClick={() => deleteButton(idx)}>
                  <IonIcon icon={trash} />
                </IonButton>
              </div>
            ))}
          </>
        )}

        {type === 'check' && (
          <>
            <IonItem>
              <IonLabel position="stacked">Check key</IonLabel>
              <IonInput
                value={d.checkKey ?? ''}
                placeholder="e.g. pincode, name"
                onIonInput={(e) => onPatchData({ checkKey: e.detail.value ?? '' })}
              />
              <IonNote slot="helper">Which collected_data key to evaluate.</IonNote>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Operator</IonLabel>
              <IonSelect
                value={d.operator ?? ''}
                placeholder="Select operator"
                onIonChange={(e) => onPatchData({ operator: e.detail.value })}
              >
                {CHECK_OPERATORS.map((op) => (
                  <IonSelectOption key={op.value} value={op.value}>
                    {op.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            {(d.operator === 'equals' || d.operator === 'not_equals' || d.operator === 'contains') && (
              <IonItem>
                <IonLabel position="stacked">Value</IonLabel>
                <IonInput
                  value={d.value ?? ''}
                  onIonInput={(e) => onPatchData({ value: e.detail.value ?? '' })}
                />
              </IonItem>
            )}

            {(d.operator === 'in_list' || d.operator === 'not_in_list') && (
              <IonItem>
                <IonLabel position="stacked">Values (one per line)</IonLabel>
                <IonTextarea
                  autoGrow
                  value={Array.isArray(d.values) ? d.values.join('\n') : ''}
                  placeholder={'400001\n400053\n110001'}
                  onIonInput={(e) => {
                    const raw = String(e.detail.value ?? '');
                    const values = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
                    onPatchData({ values });
                  }}
                />
              </IonItem>
            )}

            {d.operator === 'regex' && (
              <IonItem>
                <IonLabel position="stacked">Pattern</IonLabel>
                <IonInput
                  value={d.pattern ?? ''}
                  placeholder="^John.*"
                  onIonInput={(e) => onPatchData({ pattern: e.detail.value ?? '' })}
                />
              </IonItem>
            )}

            {(d.operator === 'in_source' || d.operator === 'not_in_source') && (
              <IonItem>
                <IonLabel position="stacked">Source</IonLabel>
                <IonSelect
                  value={d.source ?? ''}
                  placeholder="Select data source"
                  onIonChange={(e) => onPatchData({ source: e.detail.value })}
                >
                  {SOURCE_OPTIONS.map((s) => (
                    <IonSelectOption key={s.value} value={s.value}>
                      {s.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
                <IonNote slot="helper">Per-tenant list managed by the shop owner.</IonNote>
              </IonItem>
            )}

            <IonItem lines="none">
              <IonNote>
                Add two outgoing edges below: one marked Pass (true), one marked Fail (false).
              </IonNote>
            </IonItem>
          </>
        )}

        <IonListHeader>
          <IonLabel>Outgoing transitions</IonLabel>
        </IonListHeader>
        {outgoing.length === 0 && (
          <IonItem>
            <IonNote>None. Connect this node to another on the canvas to add transitions.</IonNote>
          </IonItem>
        )}
        {outgoing.map((e) => {
          const c = (e.data as any)?.condition;
          const currentType = c?.type ?? '__default__';
          return (
            <div key={e.id} style={{ padding: '8px 16px', borderTop: '1px solid var(--ion-color-light)' }}>
              <IonItem lines="none">
                <IonLabel>
                  <strong>→ {e.target}</strong>
                </IonLabel>
                <IonButton slot="end" fill="clear" color="danger" onClick={() => onDeleteEdge(e.id)}>
                  <IonIcon icon={trash} />
                </IonButton>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Condition</IonLabel>
                <IonSelect
                  value={currentType}
                  onIonChange={(ev) => handleConditionTypeChange(e, String(ev.detail.value))}
                >
                  {conditionOptionsForType(type).map((opt) => (
                    <IonSelectOption key={opt.value} value={opt.value}>
                      {opt.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              {renderConditionFields(e)}
            </div>
          );
        })}
      </IonList>
    </div>
  );
};
