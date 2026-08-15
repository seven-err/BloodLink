import { ConfirmModal } from '@/components/common/ConfirmModal';

type SignOutConfirmModalProps = {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SignOutConfirmModal({
  visible,
  loading = false,
  onCancel,
  onConfirm,
}: SignOutConfirmModalProps) {
  return (
    <ConfirmModal
      confirmDestructive
      cancelLabel="Cancel"
      confirmLabel="Sign out"
      loading={loading}
      message="You will need to sign in again to access BloodLink."
      title="Sign out?"
      visible={visible}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
