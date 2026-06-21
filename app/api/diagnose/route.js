import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export async function POST(req) {
  try {
    const body = await req.json();

    if (body.action === 'init') {
      const { data, error } = await supabase
        .from('diagnostic_sessions')
        .insert([{ car_year: body.year, car_make: body.make, car_model: body.model }])
        .select();
      
      if (error) throw error;
      return NextResponse.json({ sessionId: data[0].id });
    }

    if (body.action === 'chat') {
      const formattedHistory = body.history.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.text
      }));

      const systemPrompt = {
        role: "system",
        content: `You are an expert Master ASE-Certified Automotive Diagnostic Mechanic working in Dubai, UAE. 
        The customer drives a vehicle with these parameters. You must limit questions to exactly 1 clear follow-up at a time to identify the problem.
        Always factor in extreme heat or sand conditions typical of the GCC if relevant. 
        Once the problem is identified, clearly list the structural cause and safe operating state.`
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [systemPrompt, ...formattedHistory, { role: "user", content: body.message }]
      });

      const reply = response.choices[0].message.content;

      await supabase
        .from('diagnostic_sessions')
        .update({ chat_history: [...body.history, { role: 'user', text: body.message }, { role: 'assistant', text: reply }] })
        .eq('id', body.sessionId);

      return NextResponse.json({ reply });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}