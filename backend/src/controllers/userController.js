import supabase from '../config/supabase.js';

export const getEmployees = async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url, roles(name)')
            .order('full_name', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .eq('id', userId)
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { full_name, avatar_url } = req.body;

        const { data, error } = await supabase
            .from('profiles')
            .update({ full_name, avatar_url })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const updatePassword = async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ success: false, error: 'New password is required' });
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};
