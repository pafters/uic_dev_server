import React from 'react';
import { Label, FormGroup, Input } from '@admin-bro/design-system';
import axios from 'axios';

function rus_to_latin(str) {

  var ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i',
    'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh',
    'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'u', 'я': 'ya',
    'ъ': 'ie', 'ь': '', 'й': 'i'
  }, n_str = [];

  for (var i = 0; i < str.length; ++i) {
    n_str.push(
      ru[str[i]]
      || ru[str[i].toLowerCase()] == undefined && str[i]
      || ru[str[i].toLowerCase()].replace(/^(.)/, function (match) { return match.toUpperCase() })
    );
  }

  return n_str.join('');
}

const UploadFiles = (props) => {
  const { property, record, onChange } = props;

  async function uploadFile(formData) {
    const answer = axios.post('/api/admin/upload', formData, {
      headers: {
        'content-type': 'multipart/form-data'
      }
    })
    if (answer) {
      return answer;
    }
  }

  const handleChange = async (event) => {
    const { name, value, files } = event.target;
    const newFile = new File([files[0]], rus_to_latin(files[0].name), { type: files[0].type });
    const formData = new FormData();
    formData.append('file', newFile);
    const answer = await uploadFile(formData);
    const file = answer.data.file;
    if (file) {
      if (property.label == 'Logo')
        record.params.logo = file.path;
      else if (property.label == 'Photo')
        record.params.photo = file.path;
      else if (property.label == 'Presentation')
        record.params.presentation = file.path;
      onChange({ ...record, [name]: value });
    }
  };

  return (
    <FormGroup>
      <Label>{property.label}</Label>
      <Input
        type="file"
        name={property.name}
        onChange={handleChange}
      />
    </FormGroup>
  );
};

export default UploadFiles;