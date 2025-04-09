import React from 'react';
import {IconButton,Tooltip} from 'mui/material';
import {Brightness4,Brightness7}from '@mui/icons-material';
import {useThemeConext}from '../context/Themecontext';

const ThemeToggle=()=>{
    const {mode,toggleTheme}= useThemeContext();

return(
    <Tooltip title={`Switch TO ${mode === 'light'?'dark' : 'light'}mode`}>
        <IconButton onClick = {toggleTheme} color = "inherit">
            {mode === 'light' ? <Brightness4 />:<Brightness7/>}
        </IconButton>
    </Tooltip>

);
};

export default ThemeToggle;