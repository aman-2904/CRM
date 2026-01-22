import supabase from '../config/supabase.js';

export const getEmployees = async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .order('full_name', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
