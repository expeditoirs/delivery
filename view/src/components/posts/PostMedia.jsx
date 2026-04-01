import { useEffect, useState } from 'react';
import { resolvePostImageSource } from '../../utils/postImageCodec';

export default function PostMedia({ rawValue, imageClassName, fallbackClassName, icon, iconColor, onClick }) {
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    let active = true;
    setImageSrc('');

    resolvePostImageSource(rawValue).then((resolved) => {
      if (active && resolved) {
        setImageSrc(resolved);
      }
    });

    return () => {
      active = false;
    };
  }, [rawValue]);

  if (imageSrc) {
    return (
      <button onClick={onClick} className={imageClassName}>
        <img src={imageSrc} alt="Publicacao" className="h-full w-full object-cover" />
      </button>
    );
  }

  return (
    <button onClick={onClick} className={fallbackClassName}>
      <span className={`material-icons text-[88px] ${iconColor}`}>
        {icon}
      </span>
    </button>
  );
}