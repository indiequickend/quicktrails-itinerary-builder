'use client';
import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Settings } from '@/types';
import dynamic from 'next/dynamic';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormField,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from 'next/image';
import { useSettings } from '@/contexts/SettingsContext';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';



const BUCKET_ID = '682a2e12000f6d95161f';
const DOC_ID = '682a40a9003c3a60b1bb';

export default function SettingsForm() {
    const { databases, storage, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;


    const [isNewDoc, setIsNewDoc] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [logoUrl, setlogoUrl] = useState<string | null>(null)
    const { updateSettings, settings } = useSettings();

    const settingsFormSchema = z.object({
        companyName: z.string(),
        address: z.string(),
        phone: z.string(),
        email: z.string().email(),
        inclusionTemplateHtml: z.string().optional(),
        exclusionTemplateHtml: z.string().optional(),
        termsTemplateHtml: z.string().optional(),
        logo: z.instanceof(File).optional()

    });
    const form = useForm<z.infer<typeof settingsFormSchema>>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            companyName: '',
            address: '',
            phone: '',
            email: '',
            inclusionTemplateHtml: '',
            exclusionTemplateHtml: '',
            termsTemplateHtml: ''
        }
    });

    // Load existing settings
    useEffect(() => {
        if (settings) {
            form.setValue('companyName', settings.companyName)
            form.setValue('address', settings.address)
            form.setValue('phone', settings.phone)
            form.setValue('email', settings.email)
            form.setValue('inclusionTemplateHtml', (settings as any).inclusionTemplateHtml || '');
            form.setValue('exclusionTemplateHtml', (settings as any).exclusionTemplateHtml || '');
            form.setValue('termsTemplateHtml', (settings as any).termsTemplateHtml || '');
            setlogoUrl(settings.logoUrl)
            setIsNewDoc(false);
        }


    }, [settings]);



    async function onSave(data: z.infer<typeof settingsFormSchema>) {

        const { address, companyName, phone, email, logo, inclusionTemplateHtml, exclusionTemplateHtml, termsTemplateHtml } = data;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            let url = ''

            if (!logoUrl && logo) {
                const fileId = APPWRITE_ID.unique();
                const fileDoc = await storage.createFile(
                    BUCKET_ID,
                    fileId,
                    logo
                );
                url = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${projectId}`;
                setlogoUrl(url)
            }



            const payload: Settings = {
                companyName,
                address,
                phone,
                email,
                logoUrl: logoUrl ? logoUrl : url,
                inclusionTemplateHtml: inclusionTemplateHtml || '',
                exclusionTemplateHtml: exclusionTemplateHtml || '',
                termsTemplateHtml: termsTemplateHtml || ''

            };



            if (isNewDoc) {
                await databases.createDocument(
                    APPWRITE_DATABASE_ID,
                    '682a28440038cc7ba928',
                    DOC_ID,
                    payload
                );
                setIsNewDoc(false);
            } else {
                await databases.updateDocument(
                    APPWRITE_DATABASE_ID,
                    '682a28440038cc7ba928',
                    DOC_ID,
                    payload
                );
            }

            setSuccess(true);
            updateSettings(payload)

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)}>
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>App Settings</CardTitle>
                        <CardDescription>
                            Customize your company details and logo.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {success && (
                            <Alert>
                                <AlertDescription>Settings saved!</AlertDescription>
                            </Alert>
                        )}
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Your Company name"
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Address</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Company's registered address"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="tel"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="logo"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Company Logo</FormLabel>
                                    <div className="flex items-center space-x-4">
                                        {logoUrl && (
                                            <>
                                                <Image
                                                    src={logoUrl}
                                                    alt="Company Logo"
                                                    width={100}
                                                    height={100}
                                                    className="object-contain"
                                                />

                                            </>

                                        )}
                                        <FormControl>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                {...fieldProps}
                                                onChange={(event) => {
                                                    onChange(event.target?.files?.[0] ?? undefined);
                                                }}
                                            />
                                        </FormControl>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Itinerary Templates */}
                        <div className="border rounded-md p-3">
                            <div className="mb-4">
                                <div className="font-medium">Itinerary Templates</div>
                                <div className="text-xs text-gray-500">These act as defaults for new itineraries. Changes here won’t affect existing itineraries.</div>
                            </div>

                            <FormField
                                control={form.control}
                                name="inclusionTemplateHtml"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className='mb-4'>
                                            <FormLabel className='mb-2'>Inclusions Template <small><i>(Max 1000 Characters)</i></small></FormLabel>
                                            <FormControl>
                                                <ReactQuill theme="snow" {...field} />
                                            </FormControl>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="exclusionTemplateHtml"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className='mb-4'>
                                            <FormLabel className='mb-2'>Exclusions Template <small><i>(Max 1000 Characters)</i></small></FormLabel>
                                            <FormControl>
                                                <ReactQuill theme="snow" {...field} />
                                            </FormControl>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="termsTemplateHtml"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className='mb-4'>
                                            <FormLabel className='mb-2'>Terms & Conditions Template <small><i>(Max 10000 Characters)</i></small></FormLabel>
                                            <FormControl>
                                                <ReactQuill theme="snow" {...field} />
                                            </FormControl>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                    </CardContent>

                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving…' : 'Save Settings'}
                        </Button>
                    </CardFooter>
                </Card >
            </form>
        </Form>
    );
}
