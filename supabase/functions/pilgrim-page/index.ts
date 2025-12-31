import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pilgrimId = url.searchParams.get('id')

    if (!pilgrimId) {
      return new Response(getErrorHTML('معرف الحاج غير موجود في الرابط'), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: pilgrim, error } = await supabase
      .rpc('get_pilgrim_with_camp_info', { pilgrim_id: pilgrimId })
      .single()

    if (error || !pilgrim) {
      return new Response(getErrorHTML('لم يتم العثور على بيانات الحاج'), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    const html = getPilgrimHTML(pilgrim)
    
    return new Response(html, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    return new Response(getErrorHTML(error.message), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
})

function getPilgrimHTML(pilgrim: any): string {
  const healthStatusMap: any = {
    'healthy': { text: 'سليم', class: 'status-healthy', icon: '✅' },
    'sick': { text: 'مريض', class: 'status-sick', icon: '⚠️' },
    'emergency': { text: 'حالة طوارئ', class: 'status-emergency', icon: '🚨' }
  }

  const status = healthStatusMap[pilgrim.health_status] || healthStatusMap['healthy']
  const nationalId = pilgrim.national_id?.substring(0, 4) + '****' || 'غير متوفر'

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>معلومات الحاج - نظام مناسك الحج</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #FDFBF7 0%, #F5EBD9 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 500px;
            width: 100%;
            background: white;
            border-radius: 24px;
            box-shadow: 0 10px 40px rgba(203, 107, 4, 0.15);
            overflow: hidden;
            animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .header {
            background: linear-gradient(135deg, #CB6B04 0%, #946A3D 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        .header-icon { font-size: 48px; margin-bottom: 10px; }
        .header h1 { font-family: 'Amiri', serif; font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .pilgrim-name {
            font-family: 'Amiri', serif;
            font-size: 32px;
            font-weight: 700;
            color: #64462E;
            text-align: center;
            margin-bottom: 10px;
        }
        .pilgrim-name-en { font-size: 18px; color: #B88B4D; text-align: center; margin-bottom: 20px; }
        .status-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: fit-content;
            margin: 0 auto 30px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        .status-healthy { background: #C5D9C5; color: #568256; }
        .status-sick { background: #FFE4CC; color: #F97316; }
        .status-emergency { background: #FFE4E6; color: #EF4444; }
        .info-section { margin-bottom: 25px; }
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: 700;
            color: #64462E;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #F5EBD9;
        }
        .section-icon { font-size: 20px; color: #CB6B04; }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #FDFBF7;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #9CA3AF; font-size: 14px; }
        .info-value { color: #64462E; font-size: 14px; font-weight: 600; text-align: left; }
        .action-buttons { display: flex; gap: 12px; margin-top: 30px; }
        .btn {
            flex: 1;
            padding: 16px;
            border: none;
            border-radius: 12px;
            font-family: 'Cairo', sans-serif;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
        }
        .btn-emergency { background: #EF4444; color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
        .btn-emergency:hover { background: #DC2626; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4); }
        .btn-call { background: #568256; color: white; box-shadow: 0 4px 12px rgba(86, 130, 86, 0.3); }
        .btn-call:hover { background: #4A6F4A; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(86, 130, 86, 0.4); }
        .footer {
            text-align: center;
            padding: 20px;
            background: #FDFBF7;
            color: #B88B4D;
            font-size: 12px;
        }
        .footer-icon { font-size: 24px; margin-bottom: 8px; }
        @media (max-width: 480px) {
            .container { border-radius: 16px; }
            .pilgrim-name { font-size: 26px; }
            .action-buttons { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">🕋</div>
            <h1>نظام مناسك الحج</h1>
            <p>معلومات الحاج</p>
        </div>

        <div class="content">
            <div class="pilgrim-name">${pilgrim.full_name_arabic || 'غير متوفر'}</div>
            ${pilgrim.full_name_english ? `<div class="pilgrim-name-en">${pilgrim.full_name_english}</div>` : ''}
            
            <div class="status-badge ${status.class}">
                <span>${status.icon}</span>
                <span>${status.text}</span>
            </div>

            <div class="info-section">
                <div class="section-title">
                    <span class="section-icon">👤</span>
                    <span>المعلومات الأساسية</span>
                </div>
                <div class="info-row">
                    <span class="info-label">الرقم الوطني</span>
                    <span class="info-value">${nationalId}</span>
                </div>
                ${pilgrim.blood_type ? `
                <div class="info-row">
                    <span class="info-label">فصيلة الدم</span>
                    <span class="info-value">${pilgrim.blood_type}</span>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <div class="section-title">
                    <span class="section-icon">⛺</span>
                    <span>معلومات الرحلة</span>
                </div>
                ${pilgrim.group_number ? `
                <div class="info-row">
                    <span class="info-label">رقم المجموعة</span>
                    <span class="info-value">${pilgrim.group_number}</span>
                </div>
                ` : ''}
                ${pilgrim.bus_number ? `
                <div class="info-row">
                    <span class="info-label">رقم الباص</span>
                    <span class="info-value">${pilgrim.bus_number}</span>
                </div>
                ` : ''}
                ${pilgrim.camp_name ? `
                <div class="info-row">
                    <span class="info-label">المخيم</span>
                    <span class="info-value">${pilgrim.camp_name}</span>
                </div>
                ` : ''}
                ${pilgrim.camp_location_name ? `
                <div class="info-row">
                    <span class="info-label">موقع المخيم</span>
                    <span class="info-value">
                        ${pilgrim.camp_lat && pilgrim.camp_lng ? `
                            <a href="https://www.google.com/maps?q=${pilgrim.camp_lat},${pilgrim.camp_lng}" 
                               target="_blank" 
                               style="color: #CB6B04; text-decoration: underline; font-weight: 600;">
                                📍 ${pilgrim.camp_location_name}
                            </a>
                        ` : pilgrim.camp_location_name}
                    </span>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <div class="section-title">
                    <span class="section-icon">📞</span>
                    <span>جهة الاتصال للطوارئ</span>
                </div>
                ${pilgrim.emergency_contact_name ? `
                <div class="info-row">
                    <span class="info-label">الاسم</span>
                    <span class="info-value">${pilgrim.emergency_contact_name}</span>
                </div>
                ` : ''}
                ${pilgrim.emergency_contact_phone ? `
                <div class="info-row">
                    <span class="info-label">رقم الهاتف</span>
                    <span class="info-value">${pilgrim.emergency_contact_phone}</span>
                </div>
                ` : ''}
            </div>

            <div class="action-buttons">
                ${pilgrim.emergency_contact_phone ? `
                <a href="tel:${pilgrim.emergency_contact_phone}" class="btn btn-emergency">
                    <span>📞</span>
                    <span>اتصال طوارئ</span>
                </a>
                ` : ''}
                ${pilgrim.phone ? `
                <a href="tel:${pilgrim.phone}" class="btn btn-call">
                    <span>📱</span>
                    <span>اتصال بالحاج</span>
                </a>
                ` : ''}
            </div>
        </div>

        <div class="footer">
            <div class="footer-icon">📱</div>
            <p>نظام إدارة ومتابعة الحجاج</p>
            <p style="margin-top: 5px; opacity: 0.7;">© 2024 مناسك الحج</p>
        </div>
    </div>
</body>
</html>`
}

function getErrorHTML(message: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>خطأ - نظام مناسك الحج</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #FDFBF7 0%, #F5EBD9 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            max-width: 500px;
            width: 100%;
            background: white;
            border-radius: 24px;
            box-shadow: 0 10px 40px rgba(203, 107, 4, 0.15);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #CB6B04 0%, #946A3D 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        .header-icon { font-size: 48px; margin-bottom: 10px; }
        .header h1 { font-family: 'Cairo', serif; font-size: 28px; font-weight: 700; }
        .error {
            text-align: center;
            padding: 40px 20px;
            color: #EF4444;
        }
        .error-icon { font-size: 64px; margin-bottom: 20px; }
        .error h3 { margin-bottom: 10px; color: #64462E; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">🕋</div>
            <h1>نظام مناسك الحج</h1>
        </div>
        <div class="error">
            <div class="error-icon">⚠️</div>
            <h3>حدث خطأ</h3>
            <p>${message}</p>
        </div>
    </div>
</body>
</html>`
}



