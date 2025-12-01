import Modal from "../../shared/components/Modal";
import LoginPage from "../pages/LoginPage";

const LoginModal = ({ isOpen, onClose, onSuccess }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-2xl font-bold mb-4 text-center">Iniciar Sesión</h2>
            <LoginPage onSuccess={onSuccess} />
        </Modal>
    );
};

export default LoginModal;