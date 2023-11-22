import React from 'react';
import { Box } from '@admin-bro/design-system';

const FilesView = (props) => {
    const { record, property } = props;

    return (
        <Box>
            <a href={`${process.env.BACKEND_API}/${record.params.path ? record.params.path : 'upload/speaker.jpg'}`} target="_blank" rel="noopener noreferrer">
                {record.params.name}
            </a>
        </Box>
    );
};

export default FilesView;