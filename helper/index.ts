import axios from 'axios';

export const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day); // JS months are 0-based
};

export const uploadImageToCloudinary = async (uri: string) => {
  const data = new FormData();
  data.append('file', {
    uri,
    type: 'image/jpeg', // adjust based on your image type
    name: `upload_${Date.now()}.jpg`,
  });
  data.append('upload_preset', 'Awesome_Project_Preset'); // Replace with your preset
  data.append('cloud_name', 'djhf1sbsw'); // Replace with your cloud name
  data.append('folder', 'awesome-project-uploads'); // The folder you specified

  try {
    const res = await axios.post(
      'https://api.cloudinary.com/v1_1/djhf1sbsw/image/upload',
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return res.data.secure_url; // Cloudinary image URL
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
};
