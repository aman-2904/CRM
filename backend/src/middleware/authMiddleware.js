import supabase from '../config/supabase.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user to request
        // We also fetch the profile to get the role efficiently
        // Note: In high-scale apps, this might be cached or part of the JWT custom claims
        const { data: profile } = await supabase
            .from('profiles')
            .select('*, roles(name)')
            .eq('id', user.id)
            .single();

        if (profile && profile.is_active === false) {
            return res.status(403).json({ error: 'Your account has been deactivated. Please contact an administrator.' });
        }

        req.user = {
            ...user,
            profile: profile,
            role: profile?.roles?.name || 'employee'
        };

        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

export default authMiddleware;
