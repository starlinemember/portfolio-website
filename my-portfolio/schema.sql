-- ===== PORTFOLIO WEBSITE DATABASE SCHEMA =====
-- Run this in your Supabase SQL Editor

-- ===== ENABLE REQUIRED EXTENSIONS =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== PROJECTS TABLE =====
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 3),
    description TEXT NOT NULL CHECK (char_length(description) >= 10),
    url TEXT NOT NULL CHECK (url ~ '^https?://'),
    image_url TEXT CHECK (image_url ~ '^https?://' OR image_url IS NULL),
    github_url TEXT CHECK (github_url ~ '^https?://' OR github_url IS NULL),
    technologies TEXT[] DEFAULT '{}',
    category VARCHAR(50) DEFAULT 'web' CHECK (category IN ('web', 'mobile', 'desktop', 'other')),
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT projects_name_unique UNIQUE (name),
    CONSTRAINT projects_url_unique UNIQUE (url)
);

-- ===== CERTIFICATES TABLE =====
CREATE TABLE IF NOT EXISTS certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 3),
    description TEXT NOT NULL CHECK (char_length(description) >= 10),
    image_url TEXT NOT NULL CHECK (image_url ~ '^https?://'),
    issuer VARCHAR(100) NOT NULL CHECK (char_length(issuer) >= 2),
    issue_date DATE,
    expiry_date DATE CHECK (expiry_date IS NULL OR expiry_date > issue_date),
    credential_id VARCHAR(100),
    credential_url TEXT CHECK (credential_url ~ '^https?://' OR credential_url IS NULL),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT certificates_credential_unique UNIQUE (credential_id) WHERE credential_id IS NOT NULL
);

-- ===== CONTACT MESSAGES TABLE =====
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL CHECK (char_length(name) >= 2),
    email VARCHAR(100) NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
    subject VARCHAR(100) NOT NULL CHECK (char_length(subject) >= 5),
    message TEXT NOT NULL CHECK (char_length(message) >= 10),
    user_agent TEXT,
    ip_address INET,
    is_read BOOLEAN DEFAULT false,
    is_spam BOOLEAN DEFAULT false,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for admin queries
    INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC),
    INDEX idx_contact_messages_is_read ON contact_messages(is_read) WHERE is_read = false
);

-- ===== ADMIN USERS TABLE =====
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL UNIQUE CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    two_factor_enabled BOOLEAN DEFAULT true,
    two_factor_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== SECURITY TABLES =====

-- Blocked IPs table
CREATE TABLE IF NOT EXISTS blocked_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_by UUID REFERENCES admin_users(id),
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    INDEX idx_blocked_ips_ip ON blocked_ips(ip_address) WHERE is_active = true,
    INDEX idx_blocked_ips_expires ON blocked_ips(expires_at) WHERE expires_at IS NOT NULL
);

-- Login attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    email VARCHAR(100),
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_login_attempts_ip_time ON login_attempts(ip_address, created_at DESC),
    INDEX idx_login_attempts_email_time ON login_attempts(email, created_at DESC) WHERE email IS NOT NULL
);

-- Admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    is_2fa_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_admin_sessions_token ON admin_sessions(session_token) WHERE expires_at > NOW(),
    INDEX idx_admin_sessions_user ON admin_sessions(user_id, expires_at DESC)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC),
    INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC),
    INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC)
);

-- ===== ROW LEVEL SECURITY POLICIES =====

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for active projects and certificates
CREATE POLICY "Public read projects" ON projects
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read certificates" ON certificates
    FOR SELECT USING (is_active = true);

-- Admin-only access for management tables
CREATE POLICY "Admin full access projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

CREATE POLICY "Admin full access certificates" ON certificates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Contact messages - insert for public, read for admin
CREATE POLICY "Public insert contact messages" ON contact_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read contact messages" ON contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

CREATE POLICY "Admin update contact messages" ON contact_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Security tables - admin only
CREATE POLICY "Admin access security tables" ON blocked_ips
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admin access login attempts" ON login_attempts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin')
        )
    );

-- ===== FUNCTIONS =====

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment view count function
CREATE OR REPLACE FUNCTION increment_project_views(project_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE projects 
    SET view_count = view_count + 1 
    WHERE id = project_id AND is_active = true;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Clean expired sessions function
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
    DELETE FROM blocked_ips WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ===== INITIAL DATA =====

-- Insert initial admin user (replace with your actual auth user ID)
-- You'll need to get this from Supabase Auth after creating your first user
-- INSERT INTO admin_users (user_id, email, role) 
-- VALUES ('your-auth-user-id-here', 'your.email@example.com', 'super_admin');

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured) WHERE is_active = true AND is_featured = true;
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_certificates_issuer ON certificates(issuer) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_certificates_issue_date ON certificates(issue_date DESC) WHERE is_active = true;

-- ===== SCHEDULED CLEANUP JOBS =====
-- These would be set up in Supabase Edge Functions or via pg_cron extension

-- Clean up old login attempts (keep only last 30 days)
-- SELECT cron.schedule('cleanup-login-attempts', '0 2 * * *', 
--     'DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL ''30 days''');

-- Clean up expired sessions and IPs
-- SELECT cron.schedule('cleanup-expired-sessions', '*/30 * * * *', 
--     'SELECT clean_expired_sessions()');

-- ===== COMMENTS FOR DOCUMENTATION =====
COMMENT ON TABLE projects IS 'Portfolio projects with metadata and analytics';
COMMENT ON TABLE certificates IS 'Professional certificates and achievements';
COMMENT ON TABLE contact_messages IS 'Contact form submissions from website visitors';
COMMENT ON TABLE admin_users IS 'Authorized admin users with role-based access';
COMMENT ON TABLE blocked_ips IS 'IP addresses blocked for security reasons';
COMMENT ON TABLE login_attempts IS 'Login attempt tracking for security monitoring';
COMMENT ON TABLE admin_sessions IS 'Active admin sessions with 2FA tracking';
COMMENT ON TABLE audit_logs IS 'Audit trail for all admin actions';

-- ===== GRANTS (for service role) =====
-- These are automatically handled by Supabase RLS policies
-- But included for completeness in self-hosted scenarios

-- GRANT SELECT ON projects, certificates TO anon;
-- GRANT INSERT ON contact_messages TO anon;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
