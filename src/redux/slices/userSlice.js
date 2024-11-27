import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
    name: 'user',
    initialState: {
        user: null,
        user_id: null,
        temp_user_id: -1,
        isAuthenticated: false,
    },
    reducers: {
        setUser(state, action) {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.user_id = action.payload.user_id;
            state.temp_user_id = -1; 
        },
       
        logout(state) {
            state.user = null;
            state.user_id = null;
            state.temp_user_id = -1;
            state.isAuthenticated = false;
        },
    },
});

// Export actions so you can dispatch them
export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
