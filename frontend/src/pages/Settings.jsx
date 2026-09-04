import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword, updateUserProfile } from '../services/api';

function Settings() {
    const { user, updateUser } = useAuth();

    // Profile state
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

    // Pre-fill profile fields when user is loaded
    useEffect(() => {
        if (user) {
            setProfileName(user.name || '');
            setProfileEmail(user.email || '');
        }
    }, [user]);

    async function handleProfileSubmit(event) {
        event.preventDefault();
        setProfileMsg({ type: '', text: '' });

        if (!profileName.trim() || !profileEmail.trim()) {
            setProfileMsg({ type: 'danger', text: 'Name and email address are required.' });
            return;
        }

        setProfileSaving(true);
        try {
            const response = await updateUserProfile({
                name: profileName.trim(),
                email: profileEmail.trim(),
            });
            if (updateUser && response.user) {
                updateUser(response.user);
            }
            setProfileMsg({ type: 'success', text: response.message || 'Profile updated successfully.' });
        } catch (error) {
            setProfileMsg({ type: 'danger', text: error.message || 'Failed to update profile.' });
        } finally {
            setProfileSaving(false);
        }
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();
        setPasswordMsg({ type: '', text: '' });

        if (!currentPassword) {
            setPasswordMsg({ type: 'danger', text: 'Please enter your current password.' });
            return;
        }

        if (!newPassword || newPassword.length < 8) {
            setPasswordMsg({ type: 'danger', text: 'New password must be at least 8 characters long.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: 'danger', text: 'New password and confirm password do not match.' });
            return;
        }

        setPasswordSaving(true);
        try {
            const response = await changePassword({
                currentPassword,
                newPassword,
            });
            setPasswordMsg({ type: 'success', text: response.message || 'Password changed successfully.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setPasswordMsg({ type: 'danger', text: error.message || 'Unable to change password.' });
        } finally {
            setPasswordSaving(false);
        }
    }

    return (
        <div className="page-container settings-page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        PREFERENCES & SECURITY
                    </p>
                    <h1>
                        Settings
                    </h1>
                    <p className="lead-copy">
                        Manage your account profile, change password, and system preferences.
                    </p>
                </div>
            </div>

            <div className="row g-4">
                {/* Profile Information Panel */}
                <div className="col-12 col-lg-6">
                    <section className="panel settings-panel h-100">
                        <div className="panel-header mb-3">
                            <h2 className="h5 mb-1">
                                <i className="bi bi-person-gear me-2 text-success" />
                                Account Profile
                            </h2>
                            <p className="text-muted small mb-0">
                                Update your personal details and registered email address.
                            </p>
                        </div>

                        {profileMsg.text && (
                            <div className={`alert alert-${profileMsg.type} alert-dismissible fade show`} role="alert">
                                {profileMsg.text}
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setProfileMsg({ type: '', text: '' })}
                                />
                            </div>
                        )}

                        <form onSubmit={handleProfileSubmit}>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="profileNameInput">
                                    Display Name
                                </label>
                                <input
                                    id="profileNameInput"
                                    type="text"
                                    className="form-control"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    required
                                    disabled={profileSaving}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label" htmlFor="profileEmailInput">
                                    Email Address
                                </label>
                                <input
                                    id="profileEmailInput"
                                    type="email"
                                    className="form-control"
                                    value={profileEmail}
                                    onChange={(e) => setProfileEmail(e.target.value)}
                                    required
                                    disabled={profileSaving}
                                />
                            </div>

                            <button
                                type="submit"
                                className="primary-button mt-2"
                                disabled={profileSaving}
                            >
                                <i className="bi bi-check2-circle me-1" />
                                {profileSaving ? 'Saving Changes...' : 'Save Profile'}
                            </button>
                        </form>
                    </section>
                </div>

                {/* Change Password Panel */}
                <div className="col-12 col-lg-6">
                    <section className="panel settings-panel h-100">
                        <div className="panel-header mb-3">
                            <h2 className="h5 mb-1">
                                <i className="bi bi-shield-lock me-2 text-success" />
                                Change Password
                            </h2>
                            <p className="text-muted small mb-0">
                                Update your login password to keep your account secure.
                            </p>
                        </div>

                        {passwordMsg.text && (
                            <div className={`alert alert-${passwordMsg.type} alert-dismissible fade show`} role="alert">
                                {passwordMsg.text}
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setPasswordMsg({ type: '', text: '' })}
                                />
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="currentPasswordInput">
                                    Current Password
                                </label>
                                <div className="input-group">
                                    <input
                                        id="currentPasswordInput"
                                        type={showCurrent ? 'text' : 'password'}
                                        className="form-control"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        required
                                        disabled={passwordSaving}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        title={showCurrent ? 'Hide password' : 'Show password'}
                                    >
                                        <i className={`bi ${showCurrent ? 'bi-eye-slash' : 'bi-eye'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label" htmlFor="newPasswordInput">
                                    New Password
                                </label>
                                <div className="input-group">
                                    <input
                                        id="newPasswordInput"
                                        type={showNew ? 'text' : 'password'}
                                        className="form-control"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                        required
                                        minLength={8}
                                        disabled={passwordSaving}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowNew(!showNew)}
                                        title={showNew ? 'Hide password' : 'Show password'}
                                    >
                                        <i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label" htmlFor="confirmPasswordInput">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmPasswordInput"
                                    type="password"
                                    className="form-control"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    required
                                    disabled={passwordSaving}
                                />
                            </div>

                            <button
                                type="submit"
                                className="primary-button mt-2"
                                disabled={passwordSaving}
                            >
                                <i className="bi bi-key me-1" />
                                {passwordSaving ? 'Updating Password...' : 'Update Password'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>

            {/* AI Assistant & System Details Panel */}
            <div className="row mt-4">
                <div className="col-12">
                    <section className="panel">
                        <h2 className="h5 mb-2">
                            <i className="bi bi-cpu me-2 text-success" />
                            AI Assistant & System Status
                        </h2>
                        <div className="row g-3 text-muted small mt-1">
                            <div className="col-md-4">
                                <strong>Local LLM Endpoint:</strong>
                                <div><code>http://127.0.0.1:11434</code></div>
                            </div>
                            <div className="col-md-4">
                                <strong>Embeddings Model:</strong>
                                <div><code>all-MiniLM-L6-v2 (Local SentenceTransformer)</code></div>
                            </div>
                            <div className="col-md-4">
                                <strong>Setup Note:</strong>
                                <div>If the AI Assistant returns unreachable status, launch Ollama in terminal with <code>ollama serve</code>.</div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Settings;
