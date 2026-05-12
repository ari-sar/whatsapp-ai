import { Handle, Position, NodeProps } from '@xyflow/react';
import { IonIcon } from '@ionic/react';
import {
  playCircleOutline,
  textOutline,
  listOutline,
  checkmarkCircleOutline,
  stopCircleOutline,
  gitBranchOutline,
} from 'ionicons/icons';
import { useBuilderStore } from '../../../store/useBuilderStore';
import './nodes.css';

const iconMap: Record<string, any> = {
  start: playCircleOutline,
  text: textOutline,
  list: listOutline,
  button: checkmarkCircleOutline,
  condition: gitBranchOutline,
  end: stopCircleOutline,
};

export const StepNode: React.FC<NodeProps> = ({ id, data }) => {
  const selectedNodeId = useBuilderStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useBuilderStore((s) => s.setSelectedNodeId);
  const isSelected = selectedNodeId === id;
  const type = (data as any)?.type ?? 'text';
  const label = (data as any)?.label ?? id;
  const prompt = (data as any)?.prompt ?? '';
  const icon = iconMap[type] || textOutline;

  return (
    <div
      className={`step-node ${isSelected ? 'selected' : ''}`}
      onClick={() => setSelectedNodeId(id)}
    >
      <Handle type="target" position={Position.Top} />
      <div className="step-node-content">
        <IonIcon icon={icon} className="step-node-icon" />
        <div className="step-node-label">{label}</div>
        <div className="step-node-id">#{id}</div>
        {prompt && <div className="step-node-prompt">{String(prompt).substring(0, 40)}...</div>}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
